# Create a Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# Create the Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "urlshortener-vnet"
  address_space       = [var.vnet_address_space]
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Subnet for SQL Private Endpoint
resource "azurerm_subnet" "sql_private_endpoint" {
  name                 = "sql-private-endpoint"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Subnet for Web App Integration with delegation
resource "azurerm_subnet" "webapp_integration" {
  name                 = "webapp-integration"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "delegation"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Get the current client config for tenant and object IDs.
data "azurerm_client_config" "current" {}

# Create a Key Vault (initially set with a default policy for the current client)
resource "azurerm_key_vault" "kv" {
  name                     = "${var.app_service_name}-kv"
  location                 = var.location
  resource_group_name      = azurerm_resource_group.rg.name
  tenant_id                = data.azurerm_client_config.current.tenant_id
  purge_protection_enabled = false

  sku_name = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Backup",
      "Restore",
      "Recover"
    ]
  }
}

# Compute the SQL connection string
locals {
  sql_connection_string = "Server=tcp:${var.sql_server_name}.database.windows.net,1433;Initial Catalog=${var.sql_database_name};Persist Security Info=False;User ID=${var.admin_username};Password=${var.admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  # Construct the Key Vault secret URI manually.
  sql_secret_uri = format("%ssecrets/%s/%s", azurerm_key_vault.kv.vault_uri, azurerm_key_vault_secret.sql_connection_string.name, azurerm_key_vault_secret.sql_connection_string.version)
}

# Store the SQL connection string as a secret in Key Vault
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "DB-CONNECTION-STRING"
  value        = local.sql_connection_string
  key_vault_id = azurerm_key_vault.kv.id
}

# Service Plan definition
resource "azurerm_service_plan" "app_plan" {
  name                = "${var.app_service_name}-plan"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "B1"
}

# Linux Web App with VNet Integration and a system-assigned Managed Identity
resource "azurerm_linux_web_app" "web_app" {
  name                = var.app_service_name
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name

  identity {
    type = "SystemAssigned"
  }

  service_plan_id           = azurerm_service_plan.app_plan.id
  virtual_network_subnet_id = azurerm_subnet.webapp_integration.id

  site_config {
    application_stack {
      node_version = "22-lts"
    }
  }

  app_settings = {
    "BASE_URL"             = "https://${var.app_service_name}.azurewebsites.net"
    "DB_PROVIDER"          = "sqlserver"
    "DB_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${local.sql_secret_uri})"
  }
}

# Grant the Web App's managed identity "get" access to the Key Vault secret
resource "azurerm_key_vault_access_policy" "web_app_policy" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.web_app.identity[0].principal_id

  secret_permissions = ["Get"]
}

# Create a SQL Server
resource "azurerm_mssql_server" "sql_server" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.admin_username
  administrator_login_password = var.admin_password
}

# Create a SQL Database
resource "azurerm_mssql_database" "sql_database" {
  name      = var.sql_database_name
  server_id = azurerm_mssql_server.sql_server.id
  sku_name  = "Basic"
}

# Create a Private Endpoint for SQL
resource "azurerm_private_endpoint" "sql_private_endpoint" {
  name                = "${var.sql_server_name}-privateEndpoint"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = azurerm_subnet.sql_private_endpoint.id

  private_service_connection {
    name                           = "${var.sql_server_name}-pls"
    private_connection_resource_id = azurerm_mssql_server.sql_server.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.private_dns_zone.id]
  }
}

# Create a Private DNS Zone for SQL Private Endpoint
resource "azurerm_private_dns_zone" "private_dns_zone" {
  name                = "privatelink.database.windows.net"
  resource_group_name = azurerm_resource_group.rg.name
}

# Generate a random ID to create a unique DNS zone link name
resource "random_id" "dns_link" {
  byte_length = 4
}

# Create a DNS Zone Virtual Network Link
resource "azurerm_private_dns_zone_virtual_network_link" "dns_zone_vnet_link" {
  name                  = "link-${random_id.dns_link.hex}"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.private_dns_zone.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false
}

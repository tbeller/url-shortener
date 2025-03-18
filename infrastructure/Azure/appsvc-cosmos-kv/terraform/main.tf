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

# Subnet for Cosmos Private Endpoint
resource "azurerm_subnet" "cosmos_private_endpoint" {
  name                 = "cosmos-private-endpoint"
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

# Create a Cosmos DB Account
resource "azurerm_cosmosdb_account" "cosmos_account" {
  name                = "${var.app_service_name}-cosmos"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

# Create a Cosmos SQL Database
resource "azurerm_cosmosdb_sql_database" "cosmos_database" {
  name                = "urlshortenerdb"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_account.name
  throughput          = 400
}

# Store the Cosmos DB connection string as a secret in Key Vault
resource "azurerm_key_vault_secret" "cosmos_connection_string" {
  name         = "DB-CONNECTION-STRING"
  value        = azurerm_cosmosdb_account.cosmos_account.primary_sql_connection_string
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
    "DB_PROVIDER"          = "cosmosdb"
    "DB_CONNECTION_STRING" = azurerm_key_vault_secret.cosmos_connection_string.value
  }
}

# Grant the Web App's managed identity "Get" access to the Key Vault secret
resource "azurerm_key_vault_access_policy" "web_app_policy" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.web_app.identity[0].principal_id

  secret_permissions = ["Get"]
}

# Create a Private Endpoint for Cosmos DB
resource "azurerm_private_endpoint" "cosmos_private_endpoint" {
  name                = "${var.app_service_name}-cosmos-privateEndpoint"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = azurerm_subnet.cosmos_private_endpoint.id

  private_service_connection {
    name                           = "${var.app_service_name}-cosmos-pls"
    private_connection_resource_id = azurerm_cosmosdb_account.cosmos_account.id
    subresource_names              = ["Sql"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.cosmos_dns_zone.id]
  }
}

# Create a Private DNS Zone for Cosmos DB Private Endpoint
resource "azurerm_private_dns_zone" "cosmos_dns_zone" {
  name                = "privatelink.documents.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

# Generate a random ID to create a unique DNS zone link name
resource "random_id" "dns_link" {
  byte_length = 4
}

# Create a DNS Zone Virtual Network Link for Cosmos DB
resource "azurerm_private_dns_zone_virtual_network_link" "dns_zone_vnet_link" {
  name                  = "link-${random_id.dns_link.hex}"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.cosmos_dns_zone.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false
}

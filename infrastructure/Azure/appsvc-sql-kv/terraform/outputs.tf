output "web_app_url" {
  description = "URL of the Web App"
  value       = "https://${azurerm_linux_web_app.web_app.default_hostname}"
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.kv.vault_uri
}

output "sql_connection_secret_uri" {
  description = "Constructed Key Vault Secret URI for the SQL Connection String"
  value       = local.sql_secret_uri
}
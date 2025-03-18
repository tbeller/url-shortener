output "web_app_url" {
  description = "URL of the Web App"
  value       = "https://${azurerm_linux_web_app.web_app.default_hostname}"
}
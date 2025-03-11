variable "location" {
  description = "Azure Region"
  type        = string
  default     = "westus2"
}

variable "app_service_name" {
  description = "App Service Name (needs to be globally unique)"
  type        = string
  default     = "url-shortener-appadfe"
}

variable "sql_server_name" {
  description = "SQL Server Name (needs to be globally unique)"
  type        = string
  default     = "urlshortenersqlserveradfe"
}

variable "sql_database_name" {
  description = "SQL Database Name"
  type        = string
  default     = "urlshortenerdb"
}

variable "admin_username" {
  description = "SQL Admin Username"
  type        = string
  default     = "sqladmin"
}

variable "admin_password" {
  description = "SQL Admin Password"
  type        = string
  sensitive   = true
}

variable "vnet_address_space" {
  description = "Virtual Network Address Space"
  type        = string
  default     = "10.0.0.0/16"
}

variable "resource_group_name" {
  description = "Resource Group name"
  type        = string
  default     = "urlshortener-rg"
}
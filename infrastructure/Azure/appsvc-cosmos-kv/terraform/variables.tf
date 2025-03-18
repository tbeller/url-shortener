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
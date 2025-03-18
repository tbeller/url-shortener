# Terraform Deployment for URL Shortener Web App

This Terraform configuration is an example for deploying the URL Shortener web application using Azure services. It provisions the following resources:

- **Azure Web App:** A Linux-based web app running Node.js.
- **Azure Cosmos DB:** A globally distributed, multi-model database using the SQL API.
- **Azure Key Vault:** To securely store the Cosmos DB connection string.
- **Virtual Network:** With dedicated subnets for a Cosmos DB Private Endpoint and Web App VNet Integration.
- **Private Endpoint & DNS:** For secure, private connectivity to Cosmos DB.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Terraform CLI](https://www.terraform.io/downloads.html)

## Deployment Steps

1. **Initialize Terraform:**

    ```sh
    terraform init
    ```

2. **Apply the Configuration:**

    ```sh
    terraform apply
    ```

    Review changes and confirm the apply when prompted.

## What This Deployment Does

- Creates a resource group.
- Provisions a virtual network with two subnets:
  - **cosmos-private-endpoint:** For the Cosmos DB Private Endpoint.
  - **webapp-integration:** For the Web App VNet Integration.
- Creates an Azure Key Vault and stores the Cosmos DB connection string as a secret.
- Defines an Azure Cosmos DB account with a SQL API database.
- Sets up an App Service Plan and a Linux Web App with VNet integration and a managed identity.
- Grants necessary Key Vault access to the Web App.
- Configures a private endpoint for Cosmos DB and links it with a private DNS zone.
- Outputs the Web App URL.

## Configuration Files

- outputs.tf
- terraform.tf
- terraform.tfvars
- variables.tf

## License

This project is licensed under the MIT License.
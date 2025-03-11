# Bicep Deployment for URL Shortener Web App

This Bicep configuration is an example for deploying the URL Shortener web application using Azure services. It provisions the following resources:

- **Azure Web App:** A Linux-based web app running Node.js.
- **Azure Cosmos DB:** A globally distributed, multi-model database using the SQL API.
- **Azure Key Vault:** To securely store the Cosmos DB connection string.
- **Virtual Network:** With dedicated subnets for a Cosmos DB Private Endpoint and Web App VNet Integration.
- **Private Endpoint & DNS:** For secure, private connectivity to Cosmos DB.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Bicep CLI](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/install)

## Deployment Steps

1. **Create a Resource Group:**

   ```bash
   az group create --name <resource-group-name> --location <resource-group-location>
   ```

2. **Deploy the Bicep Template:**

   ```bash
   az deployment group create --resource-group <resource-group-name> --template-file main.bicep
   ```

Replace `<resource-group-name>` and `<resource-group-location>` with your desired values.

## What This Deployment Does

- Creates a virtual network with two subnets:
  - **cosmos-private-endpoint:** For the Cosmos DB Private Endpoint.
  - **webapp-integration:** For the Web App VNet Integration.
- Provisions an Azure Key Vault and stores the Cosmos DB connection string as a secret.
- Sets up an App Service Plan and a Linux Web App with VNet integration and a managed identity.
- Creates an Azure Cosmos DB account along with a SQL API database.
- Configures a private endpoint for Cosmos DB and links it with a private DNS zone.

## License

This project is licensed under the MIT License.
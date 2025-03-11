@description('Azure Region')
param location string = 'westus2'

// App Service Name needs to be globally unique
@description('App Service Name')
param appServiceName string = 'url-shortener-appadfe'

@description('Virtual Network Address Space')
param vnetAddressSpace string = '10.0.0.0/16'

// Derive a Key Vault name from the App Service Name
var keyVaultName = '${appServiceName}-kv'

// Define the Cosmos DB account name based on the App Service Name
var cosmosAccountName = '${appServiceName}-cosmos'

// Define a Cosmos DB connection string variable using the document endpoint and primary key
var cosmosConnectionString = 'AccountEndpoint=${cosmosAccount.properties.documentEndpoint};AccountKey=${cosmosAccount.listKeys().primaryMasterKey};'

// Create Virtual Network with two subnets:
//   - sql-private-endpoint subnet: For the SQL Private Endpoint.
//   - webapp-integration subnet: For the Web App VNet Integration.
resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'urlshortener-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressSpace
      ]
    }
    subnets: [
      {
        name: 'cosmos-private-endpoint'
        properties: {
          addressPrefix: '10.0.1.0/24'
        }
      }
      {
        name: 'webapp-integration'
        properties: {
          addressPrefix: '10.0.2.0/24'
          delegations: [
            {
              name: 'delegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
    ]
  }
}

// Derive subnet resource IDs from the created VNet.
var cosmosPrivateEndpointSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'cosmos-private-endpoint')
var webAppIntegrationSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'webapp-integration')


// Create an Azure Key Vault to store secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
  }
}

// App Service Plan
resource appPlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${appServiceName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Linux Web App with VNet Integration and Managed Identity
resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: appServiceName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appPlan.id
    virtualNetworkSubnetId: webAppIntegrationSubnetId
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      // Remove the connectionStrings array and use appSettings with a Key Vault reference
      appSettings: [
        {
          name: 'BASE_URL'
          value: 'https://${appServiceName}.azurewebsites.net'
        }
        {
          name: 'DB_PROVIDER'
          value: 'cosmosdb'
        }
        {
          name: 'DB_CONNECTION_STRING'
          // Reference the secret stored in Key Vault
          value: '@Microsoft.KeyVault(SecretUri=${cosmosConnectionStringSecret.properties.secretUri})'
        }
      ]
    }
  }
}

// Grant the Web App's managed identity access to the Key Vault secret
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}

// Create Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

// Create a Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-11-15' = {
  name: 'urlshortenerdb'
  parent: cosmosAccount
  properties: {
    resource: {
      id: 'urlshortenerdb'
    }
  }
}

// Store the Cosmos DB connection string as a secret in Key Vault
resource cosmosConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'DB-CONNECTION-STRING'
  parent: keyVault
  properties: {
    value: cosmosConnectionString
  }
}

// Create a private endpoint for the Cosmos DB Account
resource cosmosPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: '${cosmosAccountName}-privateEndpoint'
  location: location
  properties: {
    subnet: {
      id: cosmosPrivateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${cosmosAccountName}-plsc'
        properties: {
          privateLinkServiceId: cosmosAccount.id
          groupIds: [
            'Sql'
          ]
          requestMessage: 'Please approve this private connection for Cosmos DB.'
        }
      }
    ]
  }
}

// Create a Private DNS Zone for Cosmos DB private link
resource cosmosPrivateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.documents.azure.com'
  location: 'global'
}

// Link the vNet to the Cosmos Private DNS Zone
resource cosmosDnsZoneVirtualNetworkLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  name: 'link-${uniqueString(vnet.id)}'
  parent: cosmosPrivateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

// Associate the Private Endpoint with the Private DNS Zone
resource cosmosPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = {
  name: 'default'
  parent: cosmosPrivateEndpoint
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: cosmosPrivateDnsZone.id
        }
      }
    ]
  }
}




@description('Azure Region')
param location string = 'westus2'

// App Service Name needs to be globally unique
@description('App Service Name')
param appServiceName string = 'url-shortener-appadfe'

// SQL Server Name needs to be globally unique
@description('SQL Server Name')
param sqlServerName string = 'urlshortenersqlserveradfe'

@description('SQL Database Name')
param sqlDatabaseName string = 'urlshortenerdb'

@description('SQL Admin Username')
param adminUsername string = 'sqladmin'

@description('SQL Admin Password')
@secure()
param adminPassword string

@description('Virtual Network Address Space')
param vnetAddressSpace string = '10.0.0.0/16'

// Derive a Key Vault name from the App Service Name
var keyVaultName = '${appServiceName}-kv'

// Build the SQL connection string using existing parameters
var sqlConnectionString = 'Server=tcp:${sqlServerName}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${adminUsername};Password=${adminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

/* Create Virtual Network with two subnets:
   - sql-private-endpoint subnet: For the SQL Private Endpoint.
   - webapp-integration subnet: For the Web App VNet Integration.
*/
resource vnet 'Microsoft.Network/virtualNetworks@2020-06-01' = {
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
        name: 'sql-private-endpoint'
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
var sqlPrivateEndpointSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'sql-private-endpoint')
var webAppIntegrationSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnet.name, 'webapp-integration')

/* Create an Azure Key Vault to store secrets */
resource keyVault 'Microsoft.KeyVault/vaults@2021-10-01' = {
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
    enablePurgeProtection: false // Disable Purge Protection for testing purposes
  }
}

/* Store the SQL connection string as a secret in Key Vault */
resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2021-10-01' = {
  name: 'DB-CONNECTION-STRING'
  parent: keyVault
  properties: {
    value: sqlConnectionString
  }
}

/* App Service Plan */
resource appPlan 'Microsoft.Web/serverfarms@2021-02-01' = {
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

/* Linux Web App with VNet Integration and Managed Identity */
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
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
      linuxFxVersion: 'NODE|18-lts'
      // Remove the connectionStrings array and use appSettings with a Key Vault reference
      appSettings: [
        {
          name: 'BASE_URL'
          value: 'https://${appServiceName}.azurewebsites.net'
        }
        {
          name: 'DB_CONNECTION_STRING'
          // Reference the secret stored in Key Vault
          value: '@Microsoft.KeyVault(SecretUri=${sqlConnectionStringSecret.properties.secretUri})'
        }
      ]
    }
  }
}

/* Grant the Web App's managed identity access to the Key Vault secret */
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2021-10-01' = {
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

/* SQL Server */
resource sqlServer 'Microsoft.Sql/servers@2021-11-01' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: adminUsername
    administratorLoginPassword: adminPassword
    version: '12.0'
  }
}

/* SQL Database */
resource sqlDatabase 'Microsoft.Sql/servers/databases@2021-11-01' = {
  name: sqlDatabaseName
  parent: sqlServer
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {}
}

/* SQL Private Endpoint on the dedicated subnet */
resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2020-11-01' = {
  name: '${sqlServerName}-privateEndpoint'
  location: location
  properties: {
    subnet: {
      id: sqlPrivateEndpointSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${sqlServerName}-pls'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: [
            'sqlServer'
          ]
        }
      }
    ]
  }
}

/* Private DNS Zone for SQL Private Endpoint */
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink${environment().suffixes.sqlServerHostname}'
  location: 'global'
}

/* DNS Zone Virtual Network Link */
resource dnsZoneVirtualNetworkLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'link-${uniqueString(vnet.id)}'
  parent: privateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

/* Associate the Private Endpoint with the DNS Zone by creating a DNS Zone Group */
resource sqlPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2020-11-01' = {
  name: 'default'
  parent: sqlPrivateEndpoint
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

import { type DeploymentSettings } from './infra/deployment-settings.ts'

/** Public deployment choices. Credential values belong in the operator shell. */
const settings: DeploymentSettings = {
  production: {
    branch: 'master',
    reviewers: [],
    variables: {
      PRIVACY_CONTROLLER_NAME: 'Martin Brandhaug',
      PRIVACY_CONTACT_EMAIL: 'martin@brandhaug.net'
    },
    secrets: [],
    emailSending: {
      zoneId: '60e359054276fdbe2005f1f3086eddfe',
      from: 'b2b@rg1.in'
    },
    domains: {
      web: { name: 'b2b.rg1.in', zoneId: '60e359054276fdbe2005f1f3086eddfe' },
      api: { name: 'api.b2b.rg1.in', zoneId: '60e359054276fdbe2005f1f3086eddfe' }
    }
  }
}

export default settings

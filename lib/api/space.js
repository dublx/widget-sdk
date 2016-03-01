const spaceMethods = [
  'getContentType',
  'getEntry',
  'getAsset',

  'getContentTypes',
  'getEntries',
  'getAssets',

  'createContentType',
  'createEntry',
  'createAsset',

  'updateContentType',
  'updateEntry',
  'updateAsset',

  'deleteContentType',
  'deleteEntry',
  'deleteAsset',

  'publishEntry',
  'publishAsset',
  'unpublishEntry',
  'unpublishAsset',

  'archiveEntry',
  'archiveAsset',
  'unarchiveEntry',
  'unarchiveAsset',

  'processAsset'
]

const roleMethods = [
  'get',
  'getAll',
  'save'
]

export default function createSpace (channel) {
  var space = {
    roles: createRoleApi(channel)
  }

  spaceMethods.forEach((methodName) => {
    space[methodName] = function (...args) {
      return channel.call('callSpaceMethod', methodName, args)
    }
  })

  return space
}

function createRoleApi (channel) {
  var roles = {}
  roleMethods.forEach((method) => {
    roles[method] = function (...args) {
      return channel.call('callRolesMethod', method, args)
    }
  })
  return roles
}

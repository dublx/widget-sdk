import {init} from '../../lib/api'

init(function (api) {
  let roles = api.space.roles
  let firstRole

  roles.getAll().then(function (roles) {
    console.log(roles)
    firstRole = roles[0]
  })

  var tagCanPublishButton = document.querySelector('#editor-can-publish')
  tagCanPublishButton.addEventListener('click', () => {
    roles.save(firstRole)
  })
})

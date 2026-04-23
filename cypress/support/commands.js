// Programmatic login — calls the API directly instead of going through the UI.
// Much faster than filling the login form in every test that needs auth.
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', 'http://localhost:3000/api/auth/login', { email, password }).then(({ body }) => {
    localStorage.setItem('token', body.token)
    localStorage.setItem('user', JSON.stringify(body.user))
    localStorage.setItem('rol', body.user.rol)
  })
})

// Clears session so the next test starts unauthenticated
Cypress.Commands.add('logout', () => {
  localStorage.clear()
})

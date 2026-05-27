describe('Periodos', () => {
  beforeEach(() => {
    cy.logout()
    cy.visit('/coordinador/periodos')
  })

  // CP-COORD-PER-01
  it.skip('redirects to login when accessing periodos without session', () => {})

  // CP-COORD-PER-02
  it.skip('renders periodos screen with valid coordinador session', () => {})

  // CP-COORD-PER-03
  it.skip('shows loading state while fetching periodos', () => {})

  // CP-COORD-PER-04
  it.skip('calls GET /periodos on initial load', () => {})

  // CP-COORD-PER-05
  it.skip('sends Authorization Bearer token on periodos requests', () => {})

  // CP-COORD-PER-06
  it.skip('renders main periodos table columns and rows', () => {})

  // CP-COORD-PER-07
  it.skip('renders correct badge and label for each periodo status', () => {})

  // CP-COORD-PER-08
  it.skip('opens create periodo modal from action button', () => {})

  // CP-COORD-PER-09
  it.skip('shows validation errors when submitting empty periodo form', () => {})

  // CP-COORD-PER-10
  it.skip('creates periodo successfully and refreshes list', () => {})

  // CP-COORD-PER-11
  it.skip('shows duplicate conflict feedback when creating periodo', () => {})

  // CP-COORD-PER-12
  it.skip('opens edit periodo modal with preloaded data', () => {})

  // CP-COORD-PER-13
  it.skip('updates periodo successfully and refreshes list', () => {})

  // CP-COORD-PER-14
  it.skip('shows error feedback when create or update request fails', () => {})

  // CP-COORD-PER-15
  it.skip('shows empty state when no periodos are available', () => {})

  // CP-COORD-PER-16
  it.skip('does not call unrelated endpoints from periodos module', () => {})
})
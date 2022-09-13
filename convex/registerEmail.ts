import { mutation } from './_generated/server'

export default mutation(async ({ db }, email) => {
	db.insert('email_registrations', { email })
})

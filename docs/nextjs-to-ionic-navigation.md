When navigating from `/` to `/home` with client-side routing the page would be blank. This was navigating from a NextJS app router route to another one which contains the Ionic app which in turn uses its own router.

After some investigation it appears that IonicRouter thinks the route is still `/` at the point it renders for which there is no route setup so it renders a blank page.

There is little point getting into the details of this as we should not necessarily expect the handover from NextJS router to React Router to go well.

The workaround will be to use a regular link instead and incur the cost of a hard page navigation to the user.

Another reason the hard page navigation is necessary is because Ionic has required global CSS which applies styles to
`body` among other things. These styles are highly opinionated and break other layouts. As far as I know there is no
way to apply these styles conditionally so a hard page refresh allows global styles to be loaded for one the app whilst
not affecting other routes.

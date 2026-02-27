---
name: starloop
description: Gets the next task to work on. Use this when you' run out of things to do or when the user asks to start on the next task.
argument-hint: "[todo folder path] [star role filter]"
---

In the $ARGUMENTS[0] folder there are many markdown files, each represents a todo the user has created. Please help the user to decide which of these todos is most optimal to work on with them next.

If the user does not provide the _todo folder path_ as the first argument you should ask them for it. If the user does not provide a [star role filter] as the second argument you should ask them for it.

To help you decide, there is metadata in the frontmatter of each todo described by the table below. They are all assigned to the todo by the user themselves, except the ID.

## Frontmatter properties
| Property    | Description |
| ----------- | ----------- |
| id          | The ID of the todo       |
| title       | Short description of the todo       |
| starRole    | An important role the user has in their life. The todo is associated with this role and helps them to achieve their ultimate vision for how they would master that role. This is optional. |
| starPoints  | A numerical quantification of the impact the todo has. Possible values are taken from the fibonacci sequence up to and including 13. This is optional. |
| completedAt | The date the todo was completed. Any completed todos are out of scope for consideration in this skill so ignore them. |

## Special files
In the folder there are also a few special files which do not represent todos. There is `_manifest.md` which provides metadata about the last export. Then there is `_asteroid-field.md` and `_wayfinder.md`. These are user-defined lists of a subset of their todos and serve as extra metadata on how the user is thinking about these todos.

## Asteroid field
The asteroid field contains todos which have no star points. They are _urgent_ but not necessarily _important_. Ideally these todos would be delegated, deferred, or deleted.

## Wayfinder
The wayfinder contains todos which have a non-zero amount of star points. These represent truly important objectives which the user feels are impactful and would ideally like to make as much progress as possible on.

## Further guidance
- Suggest several options to the user and allow them to choose but make it clear what your top recommendation is.
- Consider how tractable the todo is for you. Look at what tools you have to decide if you are actually able to help them with this task. For exmaple it might be that the first todo in their wayfinder is something that they can only do themselves but the second one is something you could do a great job on.
- Once you have agreed a todo with the user you should start working on it right away.
- Only suggest todos with starRole matching $ARGUMENTS[1].

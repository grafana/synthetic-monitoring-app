# Checkster development

## Checkster?

Just a project name. The intended name is `CheckEditor`

## Add route

`/routing/InitializedRouter.tsx`

```typescript jsx
{/* TODO: START REMOVE THIS */}
import {DevChecksterPage} from "./DevChecksterPage";
...
<Route path="/dev" element={<DevChecksterPage/>}/>
{/* TODO: END REMOVE THIS */}
```

## Important
**DO NOT** import anything from `components/CheckForm/**` \
**DO** Instead migrate the file/export you need, to a "global directory", or if to `components/Checkster`

### Start rocking!
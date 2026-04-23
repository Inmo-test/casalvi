#!/bin/bash

# Fix new-activity-dialog toast imports
sed -i '' "1i\\
import { toast } from 'sonner'\\
" apps/web/components/agenda/new-activity-dialog.tsx

# Fix edit-task-dialog error handling (2 locations)
sed -i '' 's/if (result\.error) {/if ('\''error'\'' in result \&\& result.error) {/g' apps/web/components/agenda/edit-task-dialog.tsx

# Fix agenda-card error handling
sed -i '' 's/if (result\.error) {/if ('\''error'\'' in result \&\& result.error) {/g' apps/web/components/agenda/agenda-card.tsx

# Fix activity-timeline error handling
sed -i '' 's/if (result\.error) {/if ('\''error'\'' in result \&\& result.error) {/g' apps/web/components/contacts/activity-timeline.tsx

# Fix new-activity-form error handling
sed -i '' 's/if (result\.error) {/if ('\''error'\'' in result \&\& result.error) {/g' apps/web/components/contacts/new-activity-form.tsx

# Fix properties new-property-activity-dialog error handling
sed -i '' 's/if (result\.error) {/if ('\''error'\'' in result \&\& result.error) {/g' apps/web/components/properties/new-property-activity-dialog.tsx

echo "Fixed error handlers"

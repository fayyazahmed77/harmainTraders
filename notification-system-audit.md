# Overhaul Notification System for Production

## Goal
Make the ERP notification system fully production-level by resolving queue configuration bugs, WebSocket port issues, missing Admin->User notification flows, and static analysis type warnings.

## Tasks
- [ ] Task 1: Fix queue worker configurations in `composer.json` to listen to `notifications,emails,audit,default` queues. -> Verify: Run `composer run dev`, dispatch event, check if worker executes custom queues.
- [ ] Task 2: Override `notifications()` relationship in the `User` model to use `App\Models\Notification`. -> Verify: Run php unit tests or check that custom scopes on the relationship don't throw errors.
- [ ] Task 3: Create the `AccessRequestStatusChanged` event and listener `SendAccessRequestStatusNotification` to trigger notifications on status transitions. -> Verify: Trigger status transition and see database notification created.
- [ ] Task 4: Fix static analysis warning in `AccessRequestService.php` by resolving request instance through `app('request')`. -> Verify: IDE warning is resolved.
- [ ] Task 5: Update `resources/js/bootstrap.ts` to set proper websocket fallback ports for secure (443) and insecure (80) connections. -> Verify: Code inspection.
- [ ] Task 6: Implement real-time Echo listener in `resources/js/Pages/notifications/Index.tsx` to automatically push incoming notifications to the active list. -> Verify: Trigger mock notification and check if it appears on the page.
- [ ] Task 7: Run complete verification suite and check for code quality and regressions. -> Verify: Run `php artisan test`.

## Done When
- All queue workers successfully process jobs on custom queues.
- Administrators receive notifications on Access Request creation and Users receive notifications on Access Request status changes.
- Notification Center updates in real-time.
- Port configurations are correct for production.

## Notes
Ensure queue workers are configured for the correct queues in production deployments.

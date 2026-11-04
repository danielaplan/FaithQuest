# Multi-User Tests

## Minimum accounts

- Admin A
- Teacher A with Class A
- Teacher B with Class B

## Scenarios

- [ ] Teacher A cannot list Class B.
- [ ] Teacher A cannot open Class B by URL.
- [ ] Teacher A cannot mutate a Class B student through REST.
- [ ] Teacher cannot set their role to admin.
- [ ] Admin can manage both classes through protected operations.
- [ ] Simultaneous point awards create both immutable activities.
- [ ] Duplicate attendance submission is idempotent.
- [ ] Two devices receive authorized Realtime changes.
- [ ] Sign-out prevents further protected writes.
- [ ] Owner replacement retains all records.

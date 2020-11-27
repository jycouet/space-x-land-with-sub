module.exports = (next) => async (root, args, context, info) => {
  // add returning.id to the selection
  info.operation.selectionSet.selections[0].selectionSet.selections.push({
    kind: 'Field',
    name: {
      kind: 'Name',
      value: 'returning',
    },
    arguments: [],
    directives: [],
    selectionSet: {
      kind: 'SelectionSet',
      selections: [
        {
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'id',
          },
          arguments: [],
          directives: [],
        },
      ],
    },
  });

  // send the mutation to the graphQL source
  const result = await next(root, args, context, info);

  // select returned ids
  const ids = result.returning.map((c) => c.id);
  const responseUser = await context.spacexGQL.apiQuery.users(
    {
      where: { id: { _in: ids } },
    },
    {
      fields: {
        id: true,
        name: true,
        rocket: true,
        timestamp: true,
        twitter: true,
      },
    }
  );

  // publish new users
  context.pubsub.publish('usersAdded', responseUser);

  return result;
};

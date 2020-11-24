const resolvers = {
  Mutation: {
    insert_users_and_publish: async (
      root,
      args,
      { spacexGQL, pubsub },
      ast
    ) => {
      const isIdInReturn = isSelectionExist(ast.operation, [
        'insert_users_and_publish',
        'returning',
        'id',
      ]);

      if (!isIdInReturn) {
        throw Error(
          'To be able to publish well in [userAdded] message, you need to query here for returning id. Thx'
        );
      }

      // transform args to [users_insert_input] type
      const objInsertUser = {
        objects: [
          {
            name: args.name,
            rocket: args.rocket,
            twitter: args.twitter,
          },
        ],
      };

      // use the existing mutation
      const responseInsertUser = await spacexGQL.api.insert_users(
        objInsertUser
      );

      // get full user
      // => No clue why this is not working! :o
      // => And we should publish this in pubsub!
      // => Or we should publish only the id, and it's at a subscription level that we get User Info
      const responseUser = await spacexGQL.api.users(
        {
          where: { id: { _eq: responseInsertUser.returning[0].id } },
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

      // // publish the new full user
      // pubsub.publish('userAdded', responseUser.users[0]);
      pubsub.publish('userAdded', responseInsertUser.returning[0]);

      return responseInsertUser;
    },
  },
};

function isSelectionExist(operation, selection) {
  while (selection.length > 0) {
    const subSelection = getSelection(
      operation.selectionSet.selections,
      selection[0]
    );
    if (subSelection) {
      selection = selection.slice(1);
      return isSelectionExist(subSelection, selection);
    } else {
      return false;
    }
  }
  return true;
}

function getSelection(jsonArray, nameValue) {
  const el = jsonArray.filter((c) => c.name?.value === nameValue);
  if (el) {
    return el[0];
  }
}

module.exports = { resolvers };

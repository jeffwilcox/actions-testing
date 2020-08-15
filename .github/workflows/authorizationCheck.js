async function authorizationCheck({github, context}) {
  const { payload } = context;
  const { sender, action, pull_request, review, repository } = payload;
  const { login } = sender;
  console.log(`sender: ${login}`);

  let authorizedWriter = false;
  let couldAction = false; // whether it would meet the need to take action given permission

  if (pull_request && action == 'created') {
    couldAction = true;
    console.log('The pull request has been created.');
  } else if (review && pull_request) {
    const { body, state, commit_id } = review;
    console.log(`This is a pull request review. action=${action}, state=${state}, commitId=${commit_id}`);
    if (body) {
      console.log('Body:');
      console.log(body);
    }
    if (action === 'submitted' && state === 'approved') {
      console.log('submitted and approved, yo');
    }
    
    // temp
    couldAction = true;
    
    // const comment = context.payload.comment;
    // if (comment.body && comment.body.includes('/startContentBuild')) {
    //  console.log('Pull request comment includes /startContentBuild');
    //  couldAction = true;
    // }
  }

  if (pull_request) {
    const { mergeable } = pull_request;
    if (mergeable === true) {
      console.log('This pull request is mergeable.');
    } else if (mergeable === false) {
      console.log('The test merge indicates this pull_request is not yet mergeable.');
    } else if (mergeable === null) {
      console.log('The state of the merge test is not yet known. Try again later. mergeable === null');
    }
  }
  
  if (couldAction) {
    const response = await github.repos.getCollaboratorPermissionLevel({
      owner: repository.owner.login,
      repo: repository.name,
      username: login,
    });
    let permission = null;
    if (response && response.data && response.data.permission) {
      permission = response.data.permission;
    }
    console.dir(response);
    if (permission) {
      switch (permission) {
        case 'admin':
        case 'write':
          authorizedWriter = true;
          console.log(`User is authorized to contribute to ${repository.full_name}`); // todo: grab from response
          break;
        default:
          break;
      }
    } else {
      console.log('Permission level for the user could not be retrieved.');
    }
  }

  return { collaborator: false, action: false, authorizedWriter: false };
}

module.exports = authorizationCheck;

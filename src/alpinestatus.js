const alpineStatusKey = process.env.ALPINE_STATUS_KEY;

export function findProject(requestor, searchTerm) {
  const DEX_URL = 'https://v2.alpinestatus.com/utilities/discord_ask_dex.php';

  const query = new URLSearchParams({
    key: alpineStatusKey,
    text: searchTerm,
    requestor
  })

  return fetch(`${DEX_URL}?${query.toString()}`);
}

export async function authorizeUser(requestor, authorize, email) {
  const AUTH_URL = 'https://v2.alpinestatus.com/utilities/discord_authorize.php';

  const query = new URLSearchParams({
    key: alpineStatusKey,
    requestor
  });

  return fetch(`${AUTH_URL}?${query.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ authorize, email })
  });
}
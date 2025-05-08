import static_json_v1 from "./json/data.json" with { type: 'json' };

function hostnameFromEmailAddress(email) {
  if (email && typeof email === "string" && email.search(/@/) > 0)
    return email.split(/@/)[1];
  return null;
}

export function isFakeDomain(domain, json = false) {
  if (!json) json = static_json_v1;
  for (let dom of Object.keys(json.domains)) {
    // exact match
    if (dom === domain.toLowerCase().trim()) return dom;
    // subdomain match
    if (domain.search(new RegExp(`.+\.${dom}`)) === 0) return dom;
  }
  return false;
}

export function isFakeEmail(email, json = false) {
  return isFakeDomain(hostnameFromEmailAddress(email), json);
}

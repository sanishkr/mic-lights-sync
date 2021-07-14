import { v4 as uuid_v4 } from "uuid";

const getUuid = () => {
  let uuid = localStorage.getItem('uuid')
  if(!uuid) {
    uuid = uuid_v4();
    localStorage.setItem('uuid', uuid);
  }
  return uuid
}

export {getUuid};
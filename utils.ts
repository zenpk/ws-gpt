export type Resp = {
  ok: boolean;
  msg: string;
};

export function genResp(ok: boolean, msg: string) {
  const resp: Resp = {
    ok: ok,
    msg: msg,
  };
  return JSON.stringify(resp);
}

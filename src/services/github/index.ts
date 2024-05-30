type GHObjectBase<DIR extends boolean> = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: DIR extends true ? null : string;
  type: DIR extends true ? "dir" : "file";
};
type GHRawObjectBase<DIR extends boolean> = GHObjectBase<DIR> & {
  _links: {
    self: string;
    git: string;
    html: string;
  };
};
export type GHDirRawObject = GHRawObjectBase<true>;
export type GHFileRawObject = GHRawObjectBase<false>;
export type GHRawObjects = (GHDirRawObject | GHFileRawObject)[];
export type GHDirObject = GHObjectBase<true>;
export type GHFileObject = GHObjectBase<false>;
export type GHObjects = (GHDirObject | GHFileObject)[];

type RawContent = Buffer | Uint8Array | string;

const encodeContent = (content: RawContent) => {
  if (typeof content === "string") return content;
  if (content instanceof Buffer) return content.toString("base64");
  if (content instanceof Uint8Array)
    return Buffer.from(content).toString("base64");
  throw new Error("TypeError: content");
};

const trimFilepath = (filepath: string) => {
  while (filepath.startsWith("/")) filepath = filepath.slice(1);
  return filepath;
};

export default class Repo {
  private static headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "Content-Type": "application/json",
  };

  private static comitter = (() => {
    try {
      return JSON.parse(process.env.GITHUB_COMITTER as string);
    } catch {
      console.error("Error parsing GitHub comitter");
      return {};
    }
  })();

  readonly apiBaseUrl: string;

  constructor(user: string, repo: string) {
    this.apiBaseUrl = `https://api.github.com/repos/${user}/${repo}/contents/`;
  }

  private lastTask: Promise<any> = new Promise((r) => r(0));

  private addTask<T = any>(executor: () => T | Promise<T>) {
    return new Promise<T | null>(
      (resolve) =>
        (this.lastTask = this.lastTask.finally(async () => {
          try {
            return resolve(await executor());
          } catch {
            return resolve(null);
          }
        }))
    );
  }

  private async get(path: string) {
    try {
      const res = await fetch(this.apiBaseUrl + trimFilepath(path), {
        method: "GET",
        headers: Repo.headers,
      });
      const data = await res.json();
      if ("message" in data) throw new Error(data.message);
      return data as GHFileRawObject | GHRawObjects;
    } catch {
      return null;
    }
  }

  async ls(path: string): Promise<GHObjects | null> {
    const data = await this.get(path);
    if (data && !Array.isArray(data)) return null;
    return data ? data.map(({ _links, ...i }) => i) : data;
  }

  async getFile(path: string): Promise<GHFileObject | null> {
    const data = await this.get(path);
    if (!data) return data;
    if (Array.isArray(data)) return null;
    const { _links, ...o } = data;
    if (o.type === "file") return o;
    return null;
  }

  async upload(path: string, content: RawContent) {
    return this.addTask(async () => {
      const res = await fetch(this.apiBaseUrl + trimFilepath(path), {
        method: "PUT",
        headers: Repo.headers,
        body: JSON.stringify({
          message: "create",
          committer: Repo.comitter,
          content: encodeContent(content),
        }),
      });
      const data = await res.json();
      if ("message" in data) throw new Error(data.message);
      return data;
    });
  }

  async edit(path: string, content: RawContent) {
    return this.addTask(async () => {
      const sha = (await this.getFile(path))?.sha;
      if (!sha) throw new Error("File not found");
      const res = await fetch(this.apiBaseUrl + trimFilepath(path), {
        method: "PUT",
        headers: Repo.headers,
        body: JSON.stringify({
          message: "edit",
          committer: Repo.comitter,
          content: encodeContent(content),
          sha,
        }),
      });
      const data = await res.json();
      if ("message" in data) throw new Error(data.message);
      return data;
    });
  }

  async delete(path: string) {
    return this.addTask(async () => {
      const file = await this.getFile(path);
      if (!file) throw new Error("Not a file");
      const res = await fetch(this.apiBaseUrl + trimFilepath(path), {
        method: "DELETE",
        headers: Repo.headers,
        body: JSON.stringify({
          message: "delete",
          committer: Repo.comitter,
          sha: file.sha,
        }),
      });
      const data = await res.json();
      if ("message" in data) throw new Error(data.message);
      return data;
    });
  }
}

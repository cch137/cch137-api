type TaskOptions = {
  input: string | URL | globalThis.Request;
  init?: RequestInit;
};

export default function createFetcher(tasks: TaskOptions[]) {
  let resolve = (v?: any) => {};
  class FetchTask {
    static execGap = 1;
    static maxFetching: number = 16;
    static execting = new Set<FetchTask>();
    static queue = [...tasks];
    static executed: FetchTask[] = [];
    static promise = new Promise((r) => (resolve = r));

    static start = function () {
      const task = FetchTask.queue.pop();
      if (task) {
        if (FetchTask.execting.size <= FetchTask.maxFetching) {
          new FetchTask(task).exec();
        } else {
          FetchTask.queue.unshift(task);
        }
      } else if (FetchTask.execting.size === 0) {
        setTimeout(resolve, 1000);
        return FetchTask.promise;
      }
      setTimeout(FetchTask.start, FetchTask.execGap);
      return FetchTask.promise;
    };

    options: TaskOptions;
    done: boolean = false;
    res?: Response;
    error?: unknown;

    constructor(options: TaskOptions) {
      this.options = options;
    }

    exec() {
      if (this.done) return;
      FetchTask.execting.add(this);
      fetch(this.options.input, this.options.init)
        .then((res) => (this.res = res))
        .catch((e) => (this.error = e))
        .finally(() => {
          this.done = true;
          FetchTask.execting.delete(this);
          FetchTask.executed.push(this);
        });
    }
  }
  return FetchTask;
}

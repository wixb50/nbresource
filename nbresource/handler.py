import time
import json
import psutil

from tornado import web, gen
from notebook.base.handlers import APIHandler

from .mvsmi import get_gpus


class ResourceHandler(APIHandler):

    def _get_mem_info(self):
        mem = psutil.virtual_memory()
        mem_limit_cg_file = "/sys/fs/cgroup/memory/memory.limit_in_bytes"
        mem_usage_cg_file = "/sys/fs/cgroup/memory/memory.usage_in_bytes"
        try:
            with open(mem_limit_cg_file) as limitf, open(mem_usage_cg_file) as usagef:
                mem_limit = int(limitf.read())
                mem_usage = int(usagef.read())
        except Exception:
            mem_limit = mem.total
            mem_usage = mem.used
        return {"limit": mem_limit, "usage": mem_usage}

    def _get_ipykernel_mem_info(self, kernel_id):
        proc_mem_usage = None
        for proc in psutil.process_iter():
            cmdline = proc.cmdline()
            if cmdline and "kernel-{}.json".format(kernel_id) in cmdline[-1]:
                proc_mem_usage = proc.memory_info().rss / 1024
        return proc_mem_usage

    @gen.coroutine
    def _get_cpu_usage(self):
        with open("/sys/fs/cgroup/cpu/cpu.cfs_period_us") as f:
            cfs_period_us = int(f.read())
        with open("/sys/fs/cgroup/cpu/cpu.cfs_quota_us") as f:
            cfs_quota_us = int(f.read())

        if cfs_quota_us == -1:
            from multiprocessing import cpu_count
            cpu_count_ = cpu_count()
        else:
            cpu_count_ = cfs_quota_us / cfs_period_us

        start_time = time.time() * 1e9
        with open("/sys/fs/cgroup/cpu/cpuacct.usage") as f:
            cpu_time_start = int(f.read())

        yield gen.sleep(0.5)
        with open("/sys/fs/cgroup/cpu/cpuacct.usage") as f:
            cpu_time_end = int(f.read())

        end_time = time.time() * 1e9
        cpu_usage = (cpu_time_end - cpu_time_start) / (end_time - start_time)
        return {"limit": cpu_count_, "usage": cpu_usage}

    @gen.coroutine
    def _get_gpu_usage(self):
        info = {'gpu_info': {'limit': 0, 'usage': 0}, 'vmem_info': {'limit': 0, 'usage': 0}}
        try:
            for x in get_gpus():
                info['vmem_info']['limit'] += x.mem_total
                info['vmem_info']['usage'] += x.mem_used
                info['gpu_info']['usage'] += x.gpu_util/100
                info['gpu_info']['limit'] += 1
        except FileNotFoundError:
            pass
        return info

    @web.authenticated
    @gen.coroutine
    def get(self, info_type):
        if info_type == "memory":
            data = {"mem_info": self._get_mem_info()}
            page_type = self.get_query_argument("page")
            if page_type == "notebook":
                kernel_id = self.get_query_argument("kernel_id")
                if not kernel_id:
                    self.log.error("No kernel id in the request")
                    raise web.HTTPError(400, "No kernel id in the request")
                data["kernel_mem_info"] = self._get_ipykernel_mem_info(kernel_id)
        elif info_type == "cpu":
            cpu_data = yield self._get_cpu_usage()
            data = {"cpu_info": cpu_data}
        elif info_type in ['vmemory', 'gpu']:
            data = yield self._get_gpu_usage()
        elif info_type == "all":
            cpu_usg = yield self._get_cpu_usage()
            gpu_usg = yield self._get_gpu_usage()
            data = {
                "cpu_info": cpu_usg,
                "mem_info": self._get_mem_info(),
                "gpu_info": gpu_usg['gpu_info'],
                "vmem_info": gpu_usg['vmem_info'],
            }
            page_type = self.get_query_argument("page")
            if page_type == "notebook":
                kernel_id = self.get_query_argument("kernel_id")
                if not kernel_id:
                    self.log.error("No kernel id in the request")
                    raise web.HTTPError(400, "No kernel id in the request")
                data["kernel_mem_info"] = self._get_ipykernel_mem_info(kernel_id)
        else:
            raise web.HTTPError(400, "Not support information type")
        self.write(json.dumps({
            "status": 200,
            "data": data,
        }))

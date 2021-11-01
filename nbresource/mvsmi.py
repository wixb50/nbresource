#!/usr/bin/env python
# -*- coding: utf8 -*-

"""
A (user-)friendly wrapper to nvidia-smi
"""

import json
import os
import shlex
import subprocess


NVIDIA_SMI_GET_GPUS = "nvidia-smi --query-gpu=index,uuid,utilization.gpu,memory.total,memory.used,memory.free,driver_version,name,gpu_serial,display_active,display_mode,temperature.gpu --format=csv,noheader,nounits"


class GPU(object):
    def __init__(
        self,
        id,
        uuid,
        gpu_util,
        mem_total,
        mem_used,
        mem_free,
        driver,
        gpu_name,
        serial,
        display_mode,
        display_active,
        temperature,
    ):
        self.id = id
        self.uuid = uuid
        self.gpu_util = gpu_util
        self.mem_util = float(mem_used) / float(mem_total) * 100
        self.mem_total = mem_total
        self.mem_used = mem_used
        self.mem_free = mem_free
        self.driver = driver
        self.name = gpu_name
        self.serial = serial
        self.display_mode = display_mode
        self.display_active = display_active
        self.temperature = temperature

    def __repr__(self):
        msg = "id: {id} | UUID: {uuid} | gpu_util: {gpu_util:5.1f}% | mem_util: {mem_util:5.1f}% | mem_free: {mem_free:7.1f}MB |  mem_total: {mem_total:7.1f}MB"
        msg = msg.format(**self.__dict__)
        return msg

    def to_json(self):
        return json.dumps(self.__dict__)


class GPUProcess(object):
    def __init__(self, pid, process_name, gpu_id, gpu_uuid, gpu_name, used_memory):
        self.pid = pid
        self.process_name = process_name
        self.gpu_id = gpu_id
        self.gpu_uuid = gpu_uuid
        self.gpu_name = gpu_name
        self.used_memory = used_memory

    def __repr__(self):
        msg = "pid: {pid} | gpu_id: {gpu_id} | gpu_uuid: {gpu_uuid} | gpu_name: {gpu_name} | used_memory: {used_memory:7.1f}MB"
        msg = msg.format(**self.__dict__)
        return msg

    def to_json(self):
        return json.dumps(self.__dict__)


def to_float_or_inf(value):
    try:
        number = float(value)
    except ValueError:
        number = float("nan")
    return number


def _get_gpu(line):
    values = line.split(", ")
    id = values[0]
    uuid = values[1]
    gpu_util = to_float_or_inf(values[2])
    mem_total = to_float_or_inf(values[3])
    mem_used = to_float_or_inf(values[4])
    mem_free = to_float_or_inf(values[5])
    driver = values[6]
    gpu_name = values[7]
    serial = values[8]
    display_active = values[9]
    display_mode = values[10]
    temp_gpu = to_float_or_inf(values[11])
    gpu = GPU(
        id,
        uuid,
        gpu_util,
        mem_total,
        mem_used,
        mem_free,
        driver,
        gpu_name,
        serial,
        display_mode,
        display_active,
        temp_gpu,
    )
    return gpu


def get_gpus():
    output = subprocess.check_output(shlex.split(NVIDIA_SMI_GET_GPUS))
    lines = output.decode("utf-8").split(os.linesep)
    gpus = (_get_gpu(line) for line in lines if line.strip())
    return gpus

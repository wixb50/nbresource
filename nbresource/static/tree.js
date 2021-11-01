define([
    'jquery',
    'base/js/utils',
    'base/js/namespace'
], function ($, utils, Jupyter) {
    var show_system_info = function () {
        // 调整宽度
        var left_nav = $(".dynamic-instructions").parent();
        left_nav.removeClass('col-sm-8');
        left_nav.addClass('col-sm-4');
        var right_nav = left_nav.next();
        right_nav.removeClass('col-sm-4');
        right_nav.addClass('col-sm-8');

        $('#notebook_toolbar .pull-right').prepend(`
            <span class="dropdown" id="resource_dp">
                <button class="btn btn-default btn-xs dropdown-toggle" id="dropdownMenu1" data-toggle="dropdown">
                    <span style="vertical-align: middle;color:#777;display: inline-block;padding-right: 4px">内存使用</span>
                    <div class="progress" style="margin-bottom: 0px; display: inline-block;vertical-align: middle; min-width: 185px; padding-right: 5px">
                        <div class="progress-bar progress-bar-success bar_mem" role="progresdbar" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                        <p id="show-mem-usage" style="margin-left: 0px;right:90px;color:#333;font-size: 13px">0M/0G</p>
                    </div>
                    <span class="caret"></span>
                </button>
            
                <ul class="dropdown-menu" id='nb-resource' role="menu" aria-labelledby="dropdown1">
                    <li role="presentation">
                        <span style="vertical-align: middle;color:#777;display: inline-block;padding-right: 4px;padding-left:5px;font-size:12px">CPU使用</span>
                        <div class="progress" style="margin-bottom: 0px; display: inline-block;vertical-align: middle; min-width: 185px; padding-right: 5px">
                            <div class="progress-bar progress-bar-success bar_cpu" role="progresdbar" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                            <p id="show-cpu-usage" style="position: absolute;margin-left: 15px;right:90px;color:#333;font-size: 13px">0/0</p>
                        </div>
                        <span>&nbsp;&nbsp;&nbsp;</span>
                    </li>
                    <li role="presentation" class="divider"></li>
                    <li role="presentation">
                        <span style="vertical-align: middle;color:#777;display: inline-block;padding-right: 4px;padding-left:5px;font-size:12px">显存使用</span>
                        <div class="progress" style="margin-bottom: 0px; display: inline-block;vertical-align: middle; min-width: 185px; padding-right: 5px">
                            <div class="progress-bar progress-bar-success bar_vmem" role="progresdbar" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                            <p id="show-vmem-usage" style="position: absolute;margin-left: 15px;right:90px;color:#333;font-size: 13px">0M/0G</p>
                        </div>
                        <span ></span>
                    </li>
                    <li role="presentation" class="divider"></li>
                    <li role="presentation">
                        <span style="vertical-align: middle;color:#777;display: inline-block;padding-right: 4px;padding-left:5px;font-size:12px">GPU使用</span>
                        <div class="progress" style="margin-bottom: 0px; display: inline-block;vertical-align: middle; min-width: 185px; padding-right: 5px">
                            <div class="progress-bar progress-bar-success bar_gpu" role="progresdbar" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
                            <p id="show-gpu-usage" style="position: absolute;margin-left: 15px;right:90px;color:#333;font-size: 13px">0/0</p>
                        </div>
                        <span ></span>
                    </li>
                </ul>
            </span>`);
    };


    // 显示系统信息handler
    var sysinfo_error_count = 0;
    var show_system_info_handler = function (no_cache=0) {
        var base_url = utils.get_body_data("baseUrl");
        var url = utils.url_join_encode(base_url, '/nbresource/all');
        $.ajax(url, {
            type: "GET",
            data: {page: "tree", "v": Math.round(new Date().getTime())},
            async: true,
            dataType: "json",
            timeout: 3000,
            success: function (data, status, xhr) {
                if (data.status === 200) {
                    sysinfo_error_count = 0;
                    //显示cpu
                    var cpuinfo = data.data.cpu_info;
                    if (cpuinfo.limit === null || cpuinfo.usage === null) {
                        console.warn("cpuinfo is null");
                    }
                    var limit_cpu = cpuinfo.limit.toFixed(1);
                    var usage_cpu = cpuinfo.usage.toFixed(2);
                    var cpu_ratio = usage_cpu + "/" + limit_cpu + "";
                    var cpu_show = "";
                    var cpu_width=(cpuinfo.usage / cpuinfo.limit)*100;
                     if (cpuinfo.usage / cpuinfo.limit > 0.85) {
                         $('.bar_cpu').addClass('progress-bar-danger').removeClass('progress-bar-success');
                    } else {
                         $('.bar_cpu').addClass('progress-bar-success').removeClass('progress-bar-danger');
                    }
                    cpu_show += cpu_ratio;
                    var cpu_select =  $("#show-cpu-usage");
                    cpu_select.html(cpu_show);
                    cpu_select.parent().find('.progress-bar').css({width:cpu_width+'%'}).attr('aria-valuenow',cpu_width);

                    //显示内存
                    var meminfo = data.data.mem_info;
                    if (meminfo.limit === null || meminfo.usage === null) {
                        console.warn("meminfo is null");
                        return;
                    }
                    var limit_mem = (meminfo.limit / 1024 / 1024 / 1024).toFixed(1);
                    var usage_mem = (meminfo.usage / 1024 / 1024).toFixed(0);
                    var mem_ratio = usage_mem + "M/" + limit_mem + "G";
                    var mem_show = "";
                    var mem_width=(meminfo.usage / meminfo.limit)*100;
                    if (meminfo.usage / meminfo.limit > 0.85) {
                         $('.bar_mem').addClass('progress-bar-danger').removeClass('progress-bar-success');
                    } else {
                         $('.bar_mem').addClass('progress-bar-success').removeClass('progress-bar-danger');
                    }
                    mem_show += mem_ratio;
                    var mem_select = $("#show-mem-usage");
                    mem_select.html(mem_show);
                    mem_select.parent().find('.progress-bar').css({width:mem_width+'%'}).attr('aria-valuenow',mem_width);

                    //显示gpu
                    var gpuinfo = data.data.gpu_info;
                    if (gpuinfo.limit === null || gpuinfo.usage === null) {
                        console.warn("gpuinfo is null");
                    }
                    var limit_gpu = gpuinfo.limit.toFixed(1);
                    var usage_gpu = gpuinfo.usage.toFixed(2);
                    var gpu_ratio = usage_gpu + "/" + limit_gpu + "";
                    var gpu_show = "";
                    var gpu_width=(gpuinfo.usage / gpuinfo.limit)*100;
                     if (gpuinfo.usage / gpuinfo.limit > 0.85) {
                         $('.bar_gpu').addClass('progress-bar-danger').removeClass('progress-bar-success');
                    } else {
                         $('.bar_gpu').addClass('progress-bar-success').removeClass('progress-bar-danger');
                    }
                    gpu_show += gpu_ratio;
                    var gpu_select =  $("#show-gpu-usage");
                    gpu_select.html(gpu_show);
                    gpu_select.parent().find('.progress-bar').css({width:gpu_width+'%'}).attr('aria-valuenow',gpu_width);

                    //显示显存
                    var vmeminfo = data.data.vmem_info;
                    if (vmeminfo.limit === null || vmeminfo.usage === null) {
                        console.warn("vmeminfo is null");
                        return;
                    }
                    var limit_vmem = (vmeminfo.limit / 1024).toFixed(1);
                    var usage_vmem = (vmeminfo.usage).toFixed(0);
                    var vmem_ratio = usage_vmem + "M/" + limit_vmem + "G";
                    var vmem_show = "";
                    var vmem_width=(vmeminfo.usage / vmeminfo.limit)*100;
                    if (vmeminfo.usage / vmeminfo.limit > 0.85) {
                         $('.bar_vmem').addClass('progress-bar-danger').removeClass('progress-bar-success');
                    } else {
                         $('.bar_vmem').addClass('progress-bar-success').removeClass('progress-bar-danger');
                    }
                    vmem_show += vmem_ratio;
                    var vmem_select = $("#show-vmem-usage");
                    vmem_select.html(vmem_show);
                    vmem_select.parent().find('.progress-bar').css({width:vmem_width+'%'}).attr('aria-valuenow',vmem_width);
                } else {
                    console.error(data);
                }
            },
            error: function (xhr, status, error) {
                // 连续的超过5次错误旧关闭定时查询
                sysinfo_error_count += 1;
                if(sysinfo_error_count > 5) {
                    disable_autorefresh()
                }

            }
        });
        return 0;
    };

    var sys_info_interval_id = 0;

    function disable_autorefresh(){
        clearInterval(sys_info_interval_id);
        sys_info_interval_id = 0;
    }

    function enable_autorefresh(){
        show_system_info_handler(1);
        sys_info_interval_id = setInterval(show_system_info_handler, 5000);
    }

    // stop autorefresh when page lose focus
    $(window).blur(function() {
        disable_autorefresh();
    });

    //re-enable when page get focus back
    $(window).focus(function() {
        enable_autorefresh();
    });

    // 插件加载入口
    var load_ipython_extension = function () {
        show_system_info();
        enable_autorefresh();
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };

});

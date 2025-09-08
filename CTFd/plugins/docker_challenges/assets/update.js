CTFd.plugin.run((_CTFd) => {
    const $ = _CTFd.lib.$
    $(document).ready(function() {
        $('[data-toggle="tooltip"]').tooltip();
        $.getJSON("/api/v1/docker", function(result) {
            const data = result && result.data ? result.data : []
            if (!data.length) {
                $("#dockerimage_select").prop("disabled", true)
                $("#dockerimage_label").text("Docker Image Error in Docker Config!")
                return
            }
            data.forEach(item => {
                $("#dockerimage_select").append($("<option />").val(item.name).text(item.name))
            })
            $("#dockerimage_select").val(DOCKER_IMAGE).trigger("change")
        }).fail(function() {
            $("#dockerimage_select").prop("disabled", true)
            $("#dockerimage_label").text("Docker Image Error in Docker Config!")
        })
    })
})

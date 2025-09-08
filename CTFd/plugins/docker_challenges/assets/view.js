CTFd._internal.challenge.data = undefined
CTFd._internal.challenge.renderer = CTFd._internal.markdown;

CTFd._internal.challenge.preRender = function() {}

CTFd._internal.challenge.render = function(markdown) {
    return CTFd._internal.challenge.renderer.parse(markdown)
}

CTFd._internal.challenge.postRender = function() {
    const containername = CTFd._internal.challenge.data.docker_image;
    get_docker_status(containername);
    createWarningModalBody();
}

function createWarningModalBody(){
    if (CTFd.lib.$('#warningModalBody').length === 0) {
        CTFd.lib.$('body').append('<div id="warningModalBody"></div>');
    }
}

function get_docker_status(container) {
    CTFd.fetch("/api/v1/docker_status").then(r => r.json())
    .then(result => {
        const rows = (result && result.data) || []
        for (const item of rows) {
            if (item.docker_image !== container) continue
            const host = item.host || window.location.hostname
            const ports = Array.isArray(item.ports) ? item.ports : String(item.ports || '').split(',')
            let data = ''
            ports.forEach(p => {
                const port = String(p).split('/')[0]
                data += 'Host: ' + host + ' Port: ' + port + '<br />'
            })
            CTFd.lib.$('#docker_container').html(
                '<pre>Docker Container Information:<br />' + data +
                '<div class="mt-2" id="' + String(item.instance_id).substring(0, 10) + '_revert_container"></div>'
            )
            const $link = CTFd.lib.$('.challenge-connection-info')
            const firstPort = (String(ports[0] || '').split('/')[0]) || ''
            if ($link.length) {
                const current = $link.html() || ''
                let updated = current.replace(/host/gi, host)
                updated = updated.replace(/port|\b\d{2,5}\b/gi, firstPort)
                $link.html(updated)
            } else {
                CTFd.lib.$('#docker_container').append(
                    '<div class="challenge-connection-info">Host: ' + host + ' Port: ' + firstPort + '</div>'
                )
            }
            CTFd.lib.$(".challenge-connection-info").each(function () {
                const $span = CTFd.lib.$(this)
                const html = $span.html()
                if (html.includes("<a")) return
                const urlMatch = html.match(/(http[s]?:\/\/[^\s<]+)/)
                if (urlMatch) {
                    const url = urlMatch[0]
                    const linked = html.replace(url, '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>')
                    $span.html(linked)
                }
            })
            const countDownDate = new Date(parseInt(item.revert_time) * 1000).getTime()
            const targetId = "#" + String(item.instance_id).substring(0, 10) + "_revert_container"
            const timer = setInterval(function() {
                const now = new Date().getTime()
                const distance = countDownDate - now
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                let seconds = Math.floor((distance % (1000 * 60)) / 1000)
                if (seconds < 10) seconds = "0" + seconds
                if (distance >= 0) {
                    CTFd.lib.$(targetId).html('Stop or Revert Available in ' + minutes + ':' + seconds)
                } else {
                    clearInterval(timer)
                    CTFd.lib.$(targetId).html(
                        '<a onclick="start_container(\'' + item.docker_image + '\');" class="btn btn-dark">' +
                        '<small style="color:white;"><i class="fas fa-redo"></i> Revert</small></a> '+
                        '<a onclick="stop_container(\'' + item.docker_image + '\');" class="btn btn-dark">' +
                        '<small style="color:white;"><i class="fas fa-redo"></i> Stop</small></a>'
                    )
                }
            }, 1000)
            return
        }
        const html =
            "<span>" +
            "<a onclick=\"start_container('" + CTFd._internal.challenge.data.docker_image + "');\" class='btn btn-dark'>" +
            "<small style='color:white;'><i class='fas fa-play'></i>  Start Docker Instance for challenge</small>" +
            "</a>" +
            "</span>"
        CTFd.lib.$('#docker_container').html(html)
    })
    .catch(() => {
        const html =
            "<span>" +
            "<a onclick=\"start_container('" + CTFd._internal.challenge.data.docker_image + "');\" class='btn btn-dark'>" +
            "<small style='color:white;'><i class='fas fa-play'></i>  Start Docker Instance for challenge</small>" +
            "</a>" +
            "</span>"
        CTFd.lib.$('#docker_container').html(html)
    })
}

function stop_container(container) {
    if (!confirm("Are you sure you want to stop the container for: \n" + CTFd._internal.challenge.data.name)) return
    CTFd.fetch("/api/v1/container?name=" + encodeURIComponent(container) +
               "&challenge=" + encodeURIComponent(CTFd._internal.challenge.data.name) +
               "&stopcontainer=True", { method: "GET" })
    .then(response => response.json().then(json => ({ ok: response.ok, json })))
    .then(({ ok, json }) => {
        if (ok) {
            updateWarningModal({
                title: "Attention!",
                warningText: "The Docker container for <br><strong>" + CTFd._internal.challenge.data.name + "</strong><br> was stopped successfully.",
                buttonText: "Close",
                onClose: function () { get_docker_status(container) }
            })
        } else {
            throw new Error(json.message || "Failed to stop container")
        }
    })
    .catch(error => {
        updateWarningModal({
            title: "Error",
            warningText: error.message || "An unknown error occurred while stopping the container.",
            buttonText: "Close",
            onClose: function () { get_docker_status(container) }
        })
    })
}

function start_container(container) {
    CTFd.lib.$('#docker_container').html('<div class="text-center"><i class="fas fa-circle-notch fa-spin fa-1x"></i></div>')
    CTFd.fetch("/api/v1/container?name=" + encodeURIComponent(container) + "&challenge=" + encodeURIComponent(CTFd._internal.challenge.data.name), { method: "GET" })
    .then(response => response.json().then(json => ({ ok: response.ok, json })))
    .then(({ ok, json }) => {
        if (ok) {
            get_docker_status(container)
            updateWarningModal({
                title: "Attention!",
                warningText: "A Docker container is started for you.<br>Note that you can only revert or stop a container once per 5 minutes!",
                buttonText: "Got it!"
            })
        } else {
            throw new Error(json.message || "Failed to start container")
        }
    })
    .catch(error => {
        updateWarningModal({
            title: "Error!",
            warningText: error.message || "An unknown error occurred when starting your Docker container.",
            buttonText: "Got it!",
            onClose: function () { get_docker_status(container) }
        })
    })
}

function updateWarningModal({ title , warningText, buttonText, onClose } = {}) {
    const modalHTML = `
        <div id="warningModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background-color:rgba(0,0,0,0.5);">
          <div style="position:relative; margin:10% auto; width:400px; background:white; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.3); overflow:hidden;">
            <div class="modal-header bg-warning text-dark" style="padding:1rem; display:flex; justify-content:space-between; align-items:center;">
              <h5 class="modal-title" style="margin:0;">${title}</h5>
              <button type="button" id="warningCloseBtn" style="border:none; background:none; font-size:1.5rem; line-height:1; cursor:pointer;">&times;</button>
            </div>
            <div class="modal-body" style="padding:1rem;">
              ${warningText}
            </div>
            <div class="modal-footer" style="padding:1rem; text-align:right; border-top:1px solid #dee2e6;">
              <button type="button" class="btn btn-secondary" id="warningOkBtn">${buttonText}</button>
            </div>
          </div>
        </div>
    `;
    CTFd.lib.$("#warningModalBody").html(modalHTML);
    CTFd.lib.$("#warningModal").show();
    const closeModal = () => {
        CTFd.lib.$("#warningModal").hide();
        if (typeof onClose === 'function') onClose();
    };
    CTFd.lib.$("#warningCloseBtn").on("click", closeModal);
    CTFd.lib.$("#warningOkBtn").on("click", closeModal);
}

function checkForCorrectFlag() {
    const challengeWindow = document.querySelector('#challenge-window');
    if (!challengeWindow || getComputedStyle(challengeWindow).display === 'none') {
        clearInterval(checkInterval);
        checkInterval = null;
        return;
    }
    const notification = document.querySelector('.notification-row .alert');
    if (!notification) return;
    const strong = notification.querySelector('strong');
    if (!strong) return;
    const message = strong.textContent.trim();
    if (message.includes("Correct")) {
        get_docker_status(CTFd._internal.challenge.data.docker_image);
        clearInterval(checkInterval);
        checkInterval = null;
    }
}

if (!window.checkInterval) {
    var checkInterval = setInterval(checkForCorrectFlag, 1500);
}

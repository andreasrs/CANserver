(() => {
    // layout theming utils
    const colorThemes = {
        // https://coolors.co/9a8f97-c3baba-e9e3e6-b2b2b2-736f72
        business: {
            '--color-1': 'hsla(315, 2%, 44%, 1)', /* sonic-silver */
            '--color-2': 'hsla(316, 5%, 58%, 1)', /* heliotrope-gray */
            '--color-3': 'hsla(0, 0%, 70%, 1)', /* silver-chalice */
            '--color-4': 'hsla(0, 7%, 75%, 1)', /* pale-silver */
            '--color-5': 'hsla(330, 12%, 90%, 1)' /* platinum */
        },
        // https://coolors.co/252323-70798c-f5f1ed-dad2bc-a99985
        pastel: {
            '--color-1': 'hsla(0, 3%, 14%, 1)',
            '--color-2': 'hsla(221, 11%, 49%, 1)',
            '--color-3': 'hsla(33, 17%, 59%, 1)',
            '--color-4': 'hsla(44, 29%, 80%, 1)',
            '--color-5': 'hsla(30, 29%, 95%, 1)'
        }
    }

    const activateColorTheme = name => {
        const colorTheme = colorThemes[name];

        if (colorTheme) {
            Object.keys(colorTheme).forEach(color => {
                document.documentElement.style.setProperty(color, colorTheme[color]);
            });
        }
    }

    // data fetching utils
    const getText = url => fetch(url).then(r => r.text()).catch(console.error);
    const getJSON = url => fetch(url).then(r => r.json()).catch(console.error);
    const postJSON = (url, data) => fetch(url, { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()).catch(console.error);

    // dom utils
    const el = (type, initial = {}) => {
        const element = document.createElement(type);

        if (initial.inner) {
            element.innerText = initial.inner;
        }

        if (initial.children) {
            initial.children.forEach(child => element.appendChild(child));
        }

        if (initial.className) {
            element.className = initial.className;
        }

        if (initial.attributes) {
            Object.keys(initial.attributes).forEach(attr => {
                element.setAttribute(attr, initial.attributes[attr]);
            })
        }

        return element;
    }

    const populateInputValues = (parent, data) => {
        Object.keys(data).forEach(id => {
            const input = parent.querySelector('input#' + id);
            input && (input.value = data[id]);
        });
    }

    const showInputsWithLoadedData = (parent) => {
        hide(parent.querySelector('div#loading'));
        show(parent.querySelector('form#settingsform'));
    }

    const show = element => element && element.classList && element.classList.remove('hidden');
    const hide = element => element && element.classList && element.classList.add('hidden');

    const startApp = () => {
        // STATUS page
        const statusEl = document.getElementById('status');

        if (statusEl) {
            const restartButtonEl = statusEl.querySelector('#restart');
            restartButtonEl.onclick = () => fetch('/restart');
        }

        // DISPLAY page
        const displaysEl = document.getElementById('displays');

        if (displaysEl) {
            const selectEl = displaysEl.querySelector('select#displayid');
            const displaysScriptEl = displaysEl.querySelector('textarea#displayscript');
            const displaysSaveButtonEl = displaysEl.querySelector('button#save');

            

            const selectedDisplayId = () => {
                const selectedDisplayIndex = selectEl.selectedIndex;
                return selectEl.options[selectedDisplayIndex].value;
            }

            const good = statusEl => {
                statusEl.innerText = 'Good';
                statusEl.classList.add('good');
                statusEl.classList.remove('bad');
            };

            const bad = statusEl => {
                statusEl.innerText = 'Bad';
                statusEl.classList.add('bad');
                statusEl.classList.remove('good');
            };

            const loadStatus = displayId => {
                const stateEl = displaysEl.querySelector('span#scriptstate');
                const scriptstatsEl = displaysEl.querySelector('div#scriptstats');
                const errorsEl = displaysEl.querySelector('span#errormessage');

                return getJSON('/display_stats?dispId=' + displayId).then(data => {
                    if (data.state == true) {
                        good(stateEl);
                        
                        displaysEl.querySelector('span#meantime').innerText = data.mean;
                        displaysEl.querySelector('span#maxtime').innerText = data.max;
                        displaysEl.querySelector('span#mintime').innerText = data.min;
                        displaysEl.querySelector('span#stddevtime').innerText = data.stddev;
                        
                        show(scriptstatsEl);
                        hide(errorsEl);
                    } else {
                        bad(stateEl);

                        hide(scriptstatsEl);
                        errorsEl.innerText = data.errorstring;
                        show(errorsEl);
                    }
                });
            }

            const loadDisplayScript = displayId => {
                return getText('/display_load?dispId=' + displayId).then(text => {
                    displaysScriptEl.value = text;
                    displaysScriptEl.disabled = false;
                    show(displaysSaveButtonEl);
                    loadStatus(displayId);
                });
            }

            const saveScript = displayId => {
                const scriptText = displaysScriptEl.value;
                const postInfo = {
                    script: scriptText,
                    dispId: displayId
                };

                postJSON('/display_save', postInfo).then(() => loadStatus(displayId));
            }

            // initialize default UI state
            displaysScriptEl.disabled = true;
            hide(displaysSaveButtonEl);

            // bootstrap TLN for line numbers
            TLN.append_line_numbers('displayscript');

            // handle <tab> input
            displaysScriptEl.onkeydown = function(e) {
              const keyCode = e.keyCode || e.which;
            
              if (keyCode == 9) {
                e.preventDefault();

                var start = this.selectionStart;
                var end = this.selectionEnd;
            
                // set textarea value to: text before caret + tab + text after caret
                this.value = (this.value.substring(0, start)
                            + "\t"
                            + this.value.substring(end));
            
                // put caret at right position again
                this.selectionStart = this.selectionEnd = start + 1;
              }
            };

            displaysSaveButtonEl.onclick = () => {
                const displayId = selectedDisplayId();
                saveScript(displayId);
            }

            selectEl.onchange = () => {
                const displayId = selectedDisplayId();
                loadDisplayScript(displayId);
            }

            loadDisplayScript(0);
            setInterval(() => {
                const displayId = selectedDisplayId();
                loadStatus(displayId);
            }, 5000);
        }

        // NETWORK page
        const networkEl = document.getElementById('network');

        if (networkEl) {
            // load network data
            getJSON('/network_update').then(data => {
                if ('networksettings' in data) {
                    populateInputValues(networkEl, data.networksettings);
                    showInputsWithLoadedData(networkEl);
                }
            });

            let fetchingClients = false;

            const loadClients = () => {
                const stationListEl = network.querySelector('#stationlist');
                stationListEl.innerText = '';

                // avoid building a big backlog of requests if server is slow
                if (!fetchingClients) {
                    fetchingClients = true;

                    getJSON('/network_stationlist').then(data => {
                        if ('stations' in data) {
                            const stations = data.stations;

                            if (stations.length === 0) {
                                stationListEl.innerText = 'No connected clients';
                            } else {
                                const listEl = el('ul', {
                                    children: Object.keys(stations).map(stationId => {
                                        const station = stations[stationId];
                                        return station && el('li', { inner: station.mac + ' - ' + station.ip });
                                    }).filter(Boolean)
                                })

                                stationListEl.appendChild(listEl);
                            }
                        }
                        fetchingClients = false;
                    })
                }
            }

            // load clients data
            loadClients();

            // refresh clients data
            setTimeout(loadClients, 10000);
        }

        // ANALYSIS page
        // TODO: refactor deferred because of potential conflicts

        // LOGS page
        const logsEl = document.getElementById('logs');

        if (logsEl) {
            const logsDataEl = logsEl.querySelector('#logsdata');
            const submitButtonEl = logsEl.querySelector('button#submit');
            const updateLogsData = data => logsDataEl.innerHTML = data;

            getJSON('/logs_update').then(response => {
                updateLogsData('');

                if ('sddetails' in response) {
                    if (!response.sddetails.available) {
                        updateLogsData('No SD card present. Logging disabled');
                        hide(submitButtonEl);
                        return;
                    }
                }

                Object.keys(response).forEach(entryId => {
                    const logentryEl = el('div', { attributes: { id: entryId }, className: 'separator' });

                    if (entryId === 'sddetails') {
                        const sddetails = response[entryId];

                        logentryEl.appendChild(el('div', {
                            children: [
                                el('span', { inner: 'Total SD Space ' + sddetails.totalkbytes + ' KB' })
                            ]
                        }));

                        logentryEl.appendChild(el('div', {
                            children: [
                                el('span', { inner: 'Used SD Space ' + sddetails.usedkbytes + ' KB' })
                            ]
                        }));

                        logsDataEl.prepend(logentryEl);
                    } else {
                        const labelSpanEl = el('span', { inner: entryId, className: 'logname item' });
                        logentryEl.appendChild(labelSpanEl);

                        const inputEl = el('input', {
                            attributes: {
                                type: 'checkbox',
                                name: entryId,
                                id: entryId
                            }
                        });
                        
                        const loginfo = response[entryId];
                        inputEl.checked = loginfo.enabled;
                        logentryEl.appendChild(inputEl);

                        if (loginfo.hasfile) {
                            const downloadLinkEl = el('a', {
                                className: 'download',
                                attributes: {
                                    alt: 'Download',
                                    title: 'Download',
                                    href: '/log_download?id=' + entryId
                                },
                                children: [
                                    el('img', {
                                        attributes: {
                                            style: 'vertical-align: text-top;',
                                            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGdSURBVDjLlZNLSwJhFIa1Rb8iIWhRQUlluuoftDEtC5TKSgINily1CmoT0kJBqwlSaBGBLVxItGgZQQQVFe3bKN7wOjqO2tucwRGvqAMPMzDf+8w5ZzgyADLhGhJQCWi6MCwwQBkJWVWg4jguVSqVKuVyGe0Q3sPtdruaJZJAQ+FcLgeWZWuk02kkk0lEIhFREg6H4fF4GiR0yUlABwqFAorFongnstksUqkUotGoKMjn86CPMAwjSloEFJYgAQUymQxisVhLS9WZyBsEQhu1A/RMfUutxONxsZJQKNRZ0Ey9hCqheSQSid4F9RJqh2ZCor4EBM/z4lxIQvQtoCp2HtexfW+CObAM062uu4BCElSBJWjEzc8Vrr8Y6L3zvQsoTKz6F+H7PAPz7oLRp8eodmSjp7/geDqG2b8Me9CK8zcnXK8O7AWsmDtUF9UHUw/1gr+2O8BzsPm3YLvbhPPlBI7nI6xc6jC9P/Gr3B0flHZhVpgyKwQ6LpPFtwaTdwmGCy0MpwsVWsD6ZVKQpNs6z9iV35PWsY/q6iso+w9crJoc0rRwaAAAAABJRU5ErkJggg=='
                                        }
                                    })
                                ]
                            });

                            downloadLinkEl.onclick = () => confirm('Downloading a large file will temporally impact the logging and operation of the CANServer and microDisplays.  Are you sure you want to do this now?');
                            logentryEl.appendChild(downloadLinkEl);

                            const deleteLinkEl = el('a', {
                                className: 'delete',
                                attributes: {
                                    alt: 'Delete',
                                    title: 'Delete',
                                    href: '/log_delete?id=' + entryId
                                },
                                children: [
                                    el('img', {
                                        attributes: {
                                            style: 'vertical-align: text-top;',
                                            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGqSURBVDjLlZM7S0JhGMfVox+gqYZuQkMETYZNQmi2+QGKligiCBoalFragoqGzDM41NRQQy4VKDhUSyC0NLR1EeKIt7wePV7/vc/BI97NF36cA+f9/97neQ6vCoCKrVGGgWHswyRDQxkFVU1gkCQpWSqVKuVyGZ1g3+Fyuc5aJYrASOFsNgtRFOukUikkEgmEw2FZEgqFwPN8k4SWmgS0IZ/Po1AoyE8ik8kgmUwiEonIglwuBzrE7XbLkjYBhRVIQIF0Oo1oNNrWUm0m6iYBa6O+gd6pb6WVWCwmVyIIQndBK40SqoTmEY/H/y9olFA7NBMSDSQgisWiPBeSEAMLqIrvWyde1mbgt+jwtDIBfl7D9xRQSCHoOceb3YT8wymq716I17sIbM9WfGbtTl8Blf+8OoUcC8NpAxxDwKEe0eMF+Ba5z75/gaCyq68eNK7EwQj8Zm21UVDtNoPH5XFkL9YBFpLsKvwyglscfFbuR7kLc2zKItvc8TJ93ZwgsDkNwaFHZE+Hjw01/DZtxWvl9hXBGEl6XeXLpWH+zsIJVPa9hQtfmbgjyv4BPlWugike25IAAAAASUVORK5CYII='
                                        }
                                    })
                                ]
                            });

                            deleteLinkEl.onclick = () => confirm('Are you sure you want to delete this log file?');
                            logentryEl.appendChild(deleteLinkEl);

                            const fileSizeSpanEl = el('span', {
                                className: 'indent',
                                inner: '[ size: ' + loginfo.filesize + ' ]'
                            });

                            logentryEl.appendChild(fileSizeSpanEl);
                        }

                        logsDataEl.appendChild(logentryEl);
                    }
                });
            });
        }

        // DEBUG page
        const debugEl = document.getElementById('debug');

        if (debugEl) {
            const debugDataEl = debug.querySelector('#debugdata');
            const updateDebugdata = data => debugDataEl.innerHTML = data;

            const populateValues = () => getJSON('/debug_update').then(data => {
                updateDebugdata('');

                if ('dynamicanalysisitems' in data) {
                    debugDataEl.appendChild(el('h4', { inner: 'Dynamic Analysis Items' }));

                    Object.keys(data.dynamicanalysisitems).forEach(itemId => {
                        const dynamicEl = el('div', {
                            attributes: { id: itemId }, children: [
                                el('span', { className: 'item', inner: itemId + ':' }),
                                el('span', { className: 'value', inner: data.dynamicanalysisitems[itemId] })
                            ]
                        });

                        debugDataEl.appendChild(dynamicEl);
                    });
                }

                if ("processeditems" in data) {
                    debugDataEl.appendChild(el('h4', { inner: 'Processed Items'}));
                    const processedEl = el('div', { attributes: { id: 'processeditems' } });
                    
                    Object.keys(data.processeditems).forEach(itemId => {
                        const itemEl = el('div', { attributes: { id: itemId}, children: [
                            el('span', { className: 'item', inner: itemId + ':'}),
                            el('span', { className: 'value', inner: data.processeditems[itemId]})
                        ]});

                        processedEl.appendChild(itemEl);
                    });
                    
                    debugDataEl.append(processedEl);
                }
            });

            const updateValues = () => postJSON('debug_update').then(data => {
                if ('dynamicanalysisitems' in data) {
                    Object.keys(data.dynamicanalysisitems).forEach(itemId => {
                        debug.querySelector('div#' + itemId + ' span.value').innerText = data.dynamicanalysisitems[itemId];
                    });
                }
                if ("processeditems" in data) {
                    Object.keys(data.processeditems).forEach(itemId => {
                        debug.querySelector('div#processeditems div#' + itemId + ' span.value').innerText =  data.processeditems[itemId];
                    }); 
                }
            });

            populateValues();
            setInterval(updateValues, 1000);
        }

        // layout theme selector
        const themeSelectEl = document.getElementById('theme');

        if (themeSelectEl) {
            // activate persisted choice
            const persistedSelect = localStorage.getItem('theme') || 'business';
            activateColorTheme(persistedSelect)
            themeSelectEl.value = persistedSelect;

            // activate and persist new theme choice
            themeSelectEl.onchange = e => {
                const name = e.target.value;
                activateColorTheme(name);
                localStorage.setItem('theme', name);
            };
        }
    }

    document.addEventListener('DOMContentLoaded', startApp);
})();
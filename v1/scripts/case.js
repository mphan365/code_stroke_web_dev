const DOM_Case = {
    load: function() {
        DOM_Case.case.load();
        DOM_Case.ed.load();
        DOM_Case.history.load();
        DOM_Case.assess.load();
        DOM_Case.radiology.load();
        DOM_Case.manage.load();
    },
    case: {
        load: function() {
            DOM_Case.case.btns = $(".js-case-button");
            DOM_Case.case.main = $("#js-case-main");

            DOM_Case.case.overlay = $("#js-case-overlay");
            DOM_Case.case.timer = $("#js-case-timer");
            DOM_Case.case.dialog = $("#js-case-dialog");

            DOM_Case.case.inputs = ".case-input";
            DOM_Case.case.submits = ".case-submit";

            DOM_Case.case.patient = $("#js-patient");
            DOM_Case.case.name = $("#js-patient-name");
            DOM_Case.case.age_gender = $("#js-patient-age_gender");
            DOM_Case.case.status = $("#js-patient-status");
            DOM_Case.case.time = $("#js-patient-time");
            DOM_Case.case.well = $("#js-patient-well");
        }
    },
    ed: {
        load: function() {
            DOM_Case.ed.loc = "#js-ed-loc";
            DOM_Case.ed.complete = "ed_complete";
        }
    },
    history: {
        load: function() {
            DOM_Case.history.anticoags = "#db-anticoags";
            DOM_Case.history.last_dose = "#js-history-last_dose";
        }
    },
    assess: {
        load: function() {
            DOM_Case.assess.btns = ".js-assess-button";
            DOM_Case.assess.section = "#js-assess-section";
            DOM_Case.assess.mass = "#js-assess-mass";
            DOM_Case.assess.vitals = "#js-assess-vitals";
            DOM_Case.assess.race = "#js-assess-race";
            DOM_Case.assess.race_score = "#js-assess-race-score";
            DOM_Case.assess.cannula = "#js-assess-cannula";
            DOM_Case.assess.nihss = "#js-assess-nihss";
            DOM_Case.assess.nihss_score = "#js-assess-nihss-score";
            DOM_Case.assess.mrs = "#js-assess-mrs";
            DOM_Case.assess.mrs_score = "#js-assess-mrs-score";
            DOM_Case.assess.lvo = "#js-assess-lvo";
            DOM_Case.assess.lvo_input = "#db-likely_lvo";
            DOM_Case.assess.lvo_button = "#js-assess-lvo-button";
            DOM_Case.assess.submit = "#js-assess-submit";
        }
    },
    radiology: {
        load: function() {
            DOM_Case.radiology.progress = "#js-radiology-progress"
        }
    },
    manage: {
        load: function() {
            DOM_Case.manage.thrombolysis = "#db-thrombolysis";
            DOM_Case.manage.eligibility = "#js-manage-eligibility";
            DOM_Case.manage.absolute = "#js-manage-absolute";
            DOM_Case.manage.relative = "#js-manage-relative";
            DOM_Case.manage.time = "#js-manage-time";

            DOM_Case.manage.time_button = "#js-manage-time-button";
            DOM_Case.manage.time_given = "#js-manage-time-given";
            DOM_Case.manage.time_input = "#db-thrombolysis_time_given";

            DOM_Case.manage.complete_row = "#js-manage-complete";
            DOM_Case.manage.complete_button = "#js-manage-complete-button";
        }
    }
};

const Case = {
    case_id: null,
    section: "",
    section_data: null,
    patient: null,
    load: function() {
        Case.case_id = new URL(window.location.href).searchParams.get("case_id");

        if (!Case.case_id) {
            window.location.href = "/index.html";
        } else {
            Case.case_id = parseInt(Case.case_id);
            API.get("cases", Case.case_id, Case.fillPatient);
        }

        Case.loadPageLoader();
        Case.loadSubmit();
    },
    loadSubmit: function() {
        $("body").on("click", DOM_Case.case.submits, function() {

            Case.overlay.showDialog({
                header: "warning",
                text: "Are you sure you want to Submit?",
                buttons: [
                    {
                        text: "Submit",
                        style: "yes",
                        click: function() {
                            Case.submitPage();
                        }
                    },
                    {
                        text: "Cancel",
                        style: "no",
                        click: function() {
                            Case.overlay.hideDialog();
                        }
                    }
                ]
            });
        });

    },
    submitPage: function(callback) {
        Case.overlay.hideDialog();
        Case.overlay.showTimer();

        let data = {};
        data.case_id =  Case.case_id;

        $(DOM_Case.case.inputs).each(function() {
            if (CHANGE.hasChanged($(this))) {
                Case.getInput($(this), data);
            }
        });

        console.log(data);

        API.put(Case.section, Case.case_id, data, function(result) {
            console.log(result);

            API.get(Case.section, Case.case_id, function(info) {
                Case.fillPage(info);
                if (Case.section == "cases") {
                    Case.fillPatient(info);
                }
                if (callback) {
                    callback();
                }
            });
        });
    },
    fillPatient: function(patient) {
        if (!patient) {
            window.location.href = "/index.html";
        }

        Case.patient = patient;

        DOM_Case.case.name.text(API.data.getName(patient));
        DOM_Case.case.name.prop("title", API.data.getName(patient));
        DOM_Case.case.age_gender.text(API.data.getAgeGender(patient));
        DOM_Case.case.well.text(API.data.getLastWell(patient));
        DOM_Case.case.time.text(API.data.getStatusTime(patient));

        DOM_Case.case.patient.removeClass("incoming active completed");
        switch (patient.status) {
            case "incoming":
                DOM_Case.case.patient.addClass("incoming");
                DOM_Case.case.status.text("Incoming");
                break;
            case "active":
                DOM_Case.case.patient.addClass("active");
                DOM_Case.case.status.text("Active");
                break;
            case "completed":
                DOM_Case.case.patient.addClass("completed");
                DOM_Case.case.status.text("Completed");
                break;
        }
    },
    fillPage: function(data) {
        console.log(data);
        this.section_data = data;
        DOM_Case.case["main"].html("");

        DOM_Case.case["main"].load(`${Case.section}.html`, function() {
            //Make UI inputs work
            $(document).trigger("case:load_start");

            $.each(data, function(key, value) {
                Case.setInput(key, value);
            });

            Case.overlay.hideTimer();

            $(document).trigger("case:load_end");
        });

    },
    loadPageLoader: function() {
        DOM_Case.case["btns"].click(function() {
            let button = $(this);

            if (button.hasClass("selected")) {
                return;
            }

            if (Case.overlay.dialog_active) {
                return;
            }

            if (!Case.section_data) {
                Case.loadPage(button);
                return;
            }

            let differences = [];
            let i = 0, extras = 0;
            $(DOM_Case.case.inputs).each(function() {
                if (CHANGE.hasChanged($(this))) {
                    i++;
                    if (i < 9) {
                        differences.push($(this).attr("id").slice(3));
                    } else {
                        extras++;
                    }
                }
            });

            if (extras > 0) {
                differences.push(`</br>...and ${extras} more field${extras > 1 ? "s" : ""}.`)
            }

            if (differences.length > 0) {
                Case.overlay.showDialog({
                    header: "warning",
                    text: `There are unsubmitted changes to the following fields:</br>
                    <code>${differences.join("</br>")}</code></br>
                    Are you sure you want to change pages?`,
                    buttons: [
                        {
                            text: "Discard",
                            style: "neutral",
                            click: function() {
                                Case.loadPage(button);
                            }
                        },
                        {
                            text: "Submit",
                            style: "yes",
                            click: function() {
                                Case.submitPage();
                            }
                        },
                        {
                            text: "Cancel",
                            style: "no",
                            click: function() {
                                Case.overlay.hideDialog();
                            }
                        }
                    ]
                });
            } else {
                Case.loadPage(button);
            }

        });

        $("div[data-section='case_eds']").trigger("click");
    },
    loadPage: function(button) {
        Case.overlay.hideDialog();
        Case.overlay.showTimer();

        let section = button.data("section");

        API.get(section, Case.case_id, function(data) {
            Case.section = section;

            Case.fillPage(data);

            //Change the selected button
            button.siblings(".js-case-button").removeClass("selected");
            button.addClass("selected");
        });
    },
    setInput: function(name, value) {
        let input = $("#db-" + name);

        if (Case.section == "case_eds") {
            if (name == "location") {
                $(DOM_Case.ed.loc).children("span").text(value);
                input.trigger("ui:load", "");
            } else {
                if (value == 1) {
                    input.closest("div").addClass(DOM_Case.ed.complete);
                    input.prop("checked", true);
                } else {
                    input.trigger("ui:load", value);
                    input.trigger("ui:set", value);
                }

            }
            return;
        }

        if (Case.section == "case_managements") {
            switch (name) {
                case "dob":
                case "large_vessel_occlusion":
                case "last_well":
                case "ich_found":
                    if (value == null) {
                        input.addClass("-ui-toggle-unknown");
                        input.text("Unknown");
                        return;
                    }
                default:
                     break;
            }

            switch (name) {
                case "dob":
                    console.log(`Age: ${API.data.getAge(value)}`);
                    if (API.data.getAge({dob: value}) > 18) {
                        input.addClass("-ui-toggle-yes");
                        input.text("Yes");
                        input.val(1);
                    } else {
                        input.addClass("-ui-toggle-no");
                        input.text("No");
                        input.val(0);
                    }
                    return;
                case "large_vessel_occlusion":
                    console.log(`LVO: ${value}`);
                    if (value) {
                        input.addClass("-ui-toggle-yes");
                        input.text("Yes");
                        input.val(1);
                    } else {
                        input.addClass("-ui-toggle-no");
                        input.text("No");
                        input.val(0);
                    }
                    return;
                case "last_well":
                    let time = API.data.extractTime(new Date().getTime() - new Date(value).getTime());
                    console.log(`LVO: ${time.hour}h ${time.minute}m`);
                    if ((time.hour > 3 && time.minute > 29) || time.hour > 4) {
                        input.addClass("-ui-toggle-no");
                        input.text("No");
                        input.val(0);
                    } else {
                        input.addClass("-ui-toggle-yes");
                        input.text("Yes");
                        input.val(1);
                    }
                    return;
                case "ich_found":
                    console.log(`ICH: ${value}`);
                    if (value) {
                        input.addClass("-ui-toggle-no");
                        input.text("No");
                        input.val(0);
                    } else {
                        input.addClass("-ui-toggle-yes");
                        input.text("Yes");
                        input.val(1);
                    }
                    return;
                default:
                    break;
            }
        }

        input.trigger("ui:load", value);
        input.trigger("ui:set", value);

    },
    getInput: function(element, data) {
        let key = element.attr("id").slice(3);

        /*if (Case.section == "case_eds" & key == "location") {
            let text = $(DOM_Case.ed.loc).children("span").html();
            text = (text == "") ? null : text;
            if (element.val()) {
                data[key] = element.val();
            } else {
                data[key] = text;
            }
        }*/

        if (Case.section == "case_managements") {
            switch (key) {
                case "dob":
                case "large_vessel_occlusion":
                case "last_well":
                case "ich_found":
                    data[key] = Case.section_data[key];
                    return;
                default:
                    break;
            }
        }

        let obj = {
            val: null
        };
        element.trigger("ui:get", obj);
        data[key] = obj.val;

    },
    overlay: {
        showTimer() {
            this.loading = true;
            DOM_Case.case.overlay.removeClass("hidden");
            DOM_Case.case.timer.removeClass("hidden");
        },
        hideTimer() {
            this.loading = false;
            DOM_Case.case.overlay.addClass("hidden");
            DOM_Case.case.timer.addClass("hidden");
        },
        loading: false,
        dialog_active: false,
        showDialog(settings) {
            this.dialog_active = true;
            DOM_Case.case.overlay.removeClass("hidden");

            let header = DOM_Case.case.dialog.find("header");
            header.empty();
            header.removeClass();
            switch (settings.header) {
                case "error":
                    header.addClass("error");
                    break;
                case "caution":
                    header.addClass("caution");
                    header.html(`
                        <img src="icons/button/warning.png" />
                        <span>Caution Advised</span>
                        `);
                    break;
                case "warning":
                    header.addClass("warning");
                    header.html(`
                        <img src="icons/button/warning.png" />
                        <span>Warning</span>
                        `);
                    break;
            }

            let main = DOM_Case.case.dialog.find("main");
            main.empty();
            main.html(settings.text);

            let buttons = DOM_Case.case.dialog.find("aside");
            buttons.empty();
            $.each(settings.buttons, function(index, option) {
                let button = $(`<button>${option.text}</button>`);
                button.addClass(option.style);
                button.on("click", option.click);

                buttons.append(button);
            });

            DOM_Case.case.dialog.fadeIn({
                duration: 250
            });
            DOM_Case.case.dialog.removeClass("hidden");
        },
        hideDialog() {
            this.dialog_active = false;
            DOM_Case.case.dialog.fadeOut();
            DOM_Case.case.dialog.addClass("hidden");
            DOM_Case.case.overlay.addClass("hidden");
        }
    }
};

const History = {
    load: function() {
        $("body").on("ui:toggle", DOM_Case.history["anticoags"], function() {
            let obj = {val: null};
            $(this).trigger("ui:get", obj);
            if (obj.val == "yes") {
                $(DOM_Case.history["last_dose"]).removeClass("hidden");
            } else {
                $(DOM_Case.history["last_dose"]).addClass("hidden");
            }
        });

        $(document).on("case:load_end", function() {
            $(DOM_Case.history["anticoags"]).trigger("ui:toggle");
        });
    }
}

const Assess = {
    load: function() {
        //Load Scrolling
        $("body").on("click", DOM_Case.assess["btns"], function() {
            let loc = $(this).data("anchor");
            let val = $(DOM_Case.assess[loc]).offset().top - $(DOM_Case.assess["section"]).offset().top + $(DOM_Case.assess["section"]).scrollTop();

            $(DOM_Case.assess["section"]).animate({
                scrollTop: val
            }, {
                duration: 500,
                easing: "swing"
            })

        });

        //Load score calculations
        $("body").on("ui:select", DOM_Case.assess["section"] + " .-ui-select", function() {
            Assess.calcScore("race", "race_score");
            Assess.calcScore("nihss", "nihss_score");
            Assess.calcScore("mrs", "mrs_score");
        });

        //Load likely LVO status
        $(document).on("case:load_end", function() {
            if ($(DOM_Case.assess.lvo_input).val() == "1") {
                $(DOM_Case.assess.lvo).addClass("hidden");
            } else {
                $(DOM_Case.assess.lvo).removeClass("hidden");
            }
        });

        $("body").on("click", DOM_Case.assess.lvo_button, function() {
            Case.overlay.showDialog({
                header: `caution`,
                text: `Are you sure you want to notify staff about a potential LVO?`,
                buttons: [

                    {
                        text: "Continue",
                        style: "yes",
                        click: function() {
                            $(DOM_Case.assess.lvo_input).val(1);
                            $(DOM_Case.assess.lvo_input).trigger("change");
                            Case.submitPage();
                        }
                    },
                    {
                        text: "Cancel",
                        style: "no",
                        click: function() {
                            Case.overlay.hideDialog();
                        }
                    }
                ]
            });


            $(DOM_Case.assess.lvo_input).val(1);

        });
    },
    calcScore: function(container_name, score_name) {
        let score = 0;
        $(DOM_Case.assess[container_name]).find("input").each(function(){
            //Don't add Toggle inputs
            if (!$(this).parent().hasClass("-ui-select")) {
                return;
            }

            score += parseInt($(this).val());

        });

        //Print out
        if (score || score === 0) {
            $(DOM_Case.assess[score_name]).text(score);
            $(DOM_Case.assess[score_name]).removeClass("empty");
        } else {
            $(DOM_Case.assess[score_name]).text("??");
            $(DOM_Case.assess[score_name]).addClass("empty");
        }
    }
};

const Radiology = {
    load: function() {
        //Go down the progress pathway
        //TODO: Do this smarter?
        $("body").on("ui:toggle", DOM_Case.radiology["progress"] + " .-ui-toggle", function() {
            if (Case.overlay.loading) {
                return;
            }

            let progress = 0;

            while (true) {
                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-0", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-1", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-2", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-3", "0")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-4", "1")) {
                    progress++;
                } else {
                    break;
                }

                if (Radiology.checkProgress(DOM_Case.radiology["progress"] + "-5", "1")) {
                    progress++;
                } else {
                    break;
                }

                break;
            }

            for (let i = 0; i < 7; i++) {
                if (i <= progress) {
                    $(DOM_Case.radiology["progress"] + "-" + i).removeClass("hidden");
                } else {
                    $(DOM_Case.radiology["progress"] + "-" + i).addClass("hidden");
                    $(DOM_Case.radiology["progress"] + "-" + i).find("input").val("");
                    $(DOM_Case.radiology["progress"] + "-" + i).find(".-ui-toggle").trigger("ui:clear");
                }
            }
        });

        //Ensure the proper progress is loaded when the page is loaded
        $(document).on("case:load_end", function() {
            $(DOM_Case.radiology["progress"] + "-0 .-ui-toggle").trigger("ui:toggle");
        });
    },
    checkProgress: function(id, wanted) {
        let input = $(id).find(".-ui-toggle");
        let obj = {
            val: null
        };
        input.trigger("ui:get", obj);
        if (obj.val == wanted) {
            return true;
        } else {
            return false;
        }
    }
};

const Manage = {
    load: function() {
        $("body").on("ui:toggle", DOM_Case.manage["thrombolysis"], function() {
            let obj = {val: null};
            $(this).trigger("ui:get", obj);
            if (obj.val == "1") {
                $(DOM_Case.manage["eligibility"]).removeClass("hidden");
                $(DOM_Case.manage["absolute"]).removeClass("hidden");
                $(DOM_Case.manage["relative"]).removeClass("hidden");
                $(DOM_Case.manage["time"]).removeClass("hidden");
            } else {
                $(DOM_Case.manage["eligibility"]).addClass("hidden");
                $(DOM_Case.manage["absolute"]).addClass("hidden");
                $(DOM_Case.manage["relative"]).addClass("hidden");
                $(DOM_Case.manage["time"]).addClass("hidden");
            }
        });

        $(document).on("case:load_end", function() {
            $(DOM_Case.manage["thrombolysis"]).trigger("ui:toggle");
        });

        $(document).on("case:load_end", function() {
            let obj = {val: null};
            $(DOM_Case.manage["time_input"]).trigger("ui:get", obj);

            if (obj.val) {
                $(DOM_Case.manage["time_given"]).removeClass("hidden");
                $(DOM_Case.manage["time_button"]).addClass("hidden");
            } else {
                $(DOM_Case.manage["time_given"]).addClass("hidden");
                $(DOM_Case.manage["time_button"]).removeClass("hidden");
            }
        });

        $("body").on("click", DOM_Case.manage["time_button"], function() {

            let ci = false;
            $(DOM_Case.case.inputs).each(function() {
                let key = $(this).attr("id").slice(3);
                let element = $(this);
                //Handle special cases first
                switch (key) {
                    case "thrombolysis":
                    case "ecr":
                    case "surgical_rx":
                    case "conservative_rx":
                        return;
                    case "dob":
                    case "large_vessel_occlusion":
                    case "last_well":
                    case "ich_found":
                        if ($(this).val() == "0") {
                            ci = true;
                        }
                        return;
                    default:
                        break;
                }

                if (!element.hasClass("-ui-toggle")) {
                    return;
                }

                let obj = {
                    val: null
                };
                element.trigger("ui:get", obj);

                if (obj.val == null && key != "large_vessel_occlusion") {
                    ci = null;
                    return false;
                }

                if (obj.val == "0") {
                    ci = true;
                }
            });

            let text, header;
            switch (ci) {
                case null:
                    header = "caution";
                    text = `<code>You have not filled in all the contraindication fields.</code></br>
                            Are you sure you want to proceed with Thrombolysis?`
                    break;
                case true:
                    header = "caution";
                    text = `<code>You have contraindications to Thrombolysis.</code></br>
                            Are you sure you want to proceed with Thrombolysis?`
                    break;
                case false:
                    header = "warning";
                    text = `Are you sure you want to proceed with thrombolysis?`
                    break;
            }

            Case.overlay.showDialog({
                header: header,
                text: text,
                buttons: [

                    {
                        text: "Continue",
                        style: "yes",
                        click: function() {
                            $(DOM_Case.manage["time_input"]).trigger("ui:set", [API.data.convertDateTime(new Date()), true]);
                            Case.submitPage();
                        }
                    },
                    {
                        text: "Cancel",
                        style: "no",
                        click: function() {
                            Case.overlay.hideDialog();
                        }
                    }
                ]
            });

        });

        $(document).on("case:load_end", function() {
            if (Case.patient.status == "completed") {
                $(DOM_Case.manage.complete_row).addClass("hidden");
            } else {
                $(DOM_Case.manage.complete_row).removeClass("hidden");
            }
        });

        $("body").on("click", DOM_Case.manage.complete_button, function() {
            Case.overlay.showDialog({
                header: "caution",
                text: `You are about to submit changes and mark this case as complete. </br></br>
                        <code>This will lock the case from any further editing.</code></br>
                        Are you sure you want to continue?`,
                buttons: [

                    {
                        text: "Continue",
                        style: "yes",
                        click: function() {
                            Case.overlay.hideDialog();
                            Case.overlay.showTimer();

                            let data = {};
                            data.case_id =  Case.case_id;

                            $(DOM_Case.case.inputs).each(function() {
                                if (CHANGE.hasChanged($(this))) {
                                    Case.getInput($(this), data);
                                }
                            });

                            console.log(data);

                            API.put(Case.section, Case.case_id, data, function(result) {
                                API.put("cases", Case.case_id, {
                                    status: "completed",
                                    completed_timestamp: API.data.convertDateTime(new Date())
                                }, function(result) {
                                    window.location.reload();
                                });
                            });

                        }
                    },
                    {
                        text: "Cancel",
                        style: "no",
                        click: function() {
                            Case.overlay.hideDialog();
                        }
                    }
                ]
            });
        });

    }
}


/************
 * ON READY *
 ************/

$(document).ready(function() {
    DOM_Case.load();

    Case.load();
    History.load();
    Assess.load();
    Radiology.load();
    Manage.load();
});

/*******************
 *  MISC FUNCTIONS *
 *******************/

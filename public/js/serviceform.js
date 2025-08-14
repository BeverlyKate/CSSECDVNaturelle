import { showError, showSuccess } from "./form.js";
import { addToCart } from "./cart.js";
import { Element } from "./element.js";

const EMPLOYEES_URL = "/api/employees";
const EMPLOYEES_CONTAINER = "#input-staff";

const SERVICES_URL = "/api/services";
const SERVICES_CONTAINER = "#input-tabular-service";

let cached_employees = [];

export let cart_arr = [];

$(document).ready(function () {
  refreshEmployeesMenu(EMPLOYEES_URL, EMPLOYEES_CONTAINER);
  refreshServicesMenu(SERVICES_URL, SERVICES_CONTAINER);

  $("#form-service").on("submit", function (e) {
    let service_val = $("#input-tabular-service").val();
    let staff_val = $("#input-staff").val();
    let details_val = $("#input-details").val();

    let cart_obj = {};

    if ($("#input-tabular-service").prop("disabled")) {
      e.preventDefault();
      showError("Select a valid reservation date first.", "#add-error-msg");
    } else if (!service_val) {
      e.preventDefault();
      showError(
        "Please select an service to put in the cart.",
        "#add-error-msg"
      );
    } else if (!staff_val) {
      e.preventDefault();
      showError(
        "Please select a valid Preferred Staff option.",
        "#add-error-msg"
      );
    } else {
      e.preventDefault();
      // showSuccess("Added to cart successfully!", "#add-error-msg");

      let service_select = document.getElementById("input-tabular-service");
      let staff_select = document.getElementById("input-staff");

      let service_f = service_select.options[service_select.selectedIndex].text;
      let serviceGroupName =
        service_select.options[service_select.selectedIndex].closest(
          "optgroup"
        ).label;

      let staff_f = staff_select.options[staff_select.selectedIndex].text;
      let staff_id =
        staff_select.options[staff_select.selectedIndex].getAttribute("value");

      let price =
        service_select.options[service_select.selectedIndex].getAttribute(
          "data-service-price"
        );

      ////console.log(cart_arr);

      let btn_submit = e.target.querySelector("button[type='submit']");
      btn_submit.disabled = true;

      let btn_submit_icon = btn_submit.querySelector("i");
      btn_submit_icon.className = "";
      btn_submit_icon.classList.add("spinner-border", "me-2");

      $.post("/serviceform", {
          details: details_val,
          service: service_f,
          staff: staff_f,
          employeeID: staff_id,
      }, (data, status, xhr) => {
          if (status === "success" && xhr.status === 201) {
            // Handle success, if needed
            //////console.log("AJAX request succeeded", data);

            btn_submit.disabled = false;
            btn_submit_icon.className = "";
            btn_submit_icon.classList.add("fa", "fa-cart-plus");

            addToCart(serviceGroupName, service_f, staff_f, details_val, price);

            cart_obj = {
              details: details_val,
              service: service_f,
              staff: staff_f,
            };

            cart_arr.push(cart_obj);

            snackbar({
              type: "primary",
              text: "Service added to cart successfully.",
            });
          } else {
            // Handle failure, if needed
            ////console.log("AJAX request failed", data);

            btn_submit.disabled = false;
            btn_submit_icon.className = "";
            btn_submit_icon.classList.add("fa", "fa-cart-plus");

            snackbar({
              type: "error",
              text: data.error
            });
          }
        }).fail((xhr, status, error) => {
          btn_submit.disabled = false;
          btn_submit_icon.className = "";
          btn_submit_icon.classList.add("fa", "fa-cart-plus");

          if (xhr.status === 400) {
            snackbar({
              type: "error",
              text: xhr.responseJSON.error
            });
          }
        }
      );
    }
  });
});

function refreshServicesMenu(url, container) {
  $.get(url, {}, (data, status, xhr) => {
    if (status === "success" && xhr.status === 200) {
      let input_service = document.querySelector(container);
      input_service.innerHTML = "";

      let choose_service = new Element("option", {
        text: "Choose a Service",
        attr: {
          selected: "",
          disabled: "",
          hidden: "",
        },
      }).getElement();
      input_service.appendChild(choose_service);

      let tempSpecialServicesId = [];

      data.specialServices.forEach((specialService) => {
        tempSpecialServicesId.push(specialService);
      });

      let lastServiceGroup = "";
      let service_optgroup;
      data.services.forEach((service) => {
        if (lastServiceGroup !== service.serviceTitle) {
          if (lastServiceGroup !== "")
            input_service.appendChild(service_optgroup);
          lastServiceGroup = service.serviceTitle;
          service_optgroup = new Element("optgroup", {
            attr: {
              label: service.serviceTitle,
            },
          }).getElement();
        }

        for (let i in tempSpecialServicesId) {
          if (lastServiceGroup === tempSpecialServicesId[i].serviceTitle) {
            let special_service_option = new Element("option", {
              text: tempSpecialServicesId[i].serviceOption,
              attr: {
                value: tempSpecialServicesId[i]._id,
                "data-service-price": tempSpecialServicesId[i].price,
                "data-service-type": "1",
              },
            }).getElement();
            service_optgroup.appendChild(special_service_option);
            tempSpecialServicesId.splice(Number(i), 1);
          }
        }

        let service_option = new Element("option", {
          text: service.serviceOption1 + ": " + service.serviceOption2,
          attr: {
            value: service._id,
            "data-service-price": service.price,
            "data-service-type": "0",
          },
        }).getElement();
        service_optgroup.appendChild(service_option);
        input_service.appendChild(service_optgroup);
      });
    }
  });
}

function refreshEmployeesMenu(url, container) {
  $.get(url, {}, (data, status, xhr) => {
    if (status === "success" && xhr.status === 200) {
      let input_staff = document.querySelector(container);
      input_staff.innerHTML = "";

      let choose_staff = new Element("option", {
        text: "Choose a Staff",
        attr: {
          selected: "",
          disabled: "",
          hidden: "",
        },
      }).getElement();
      input_staff.appendChild(choose_staff);

      let no_preference = new Element("option", {
        text: "No preference",
        attr: {
          value: "0",
        },
      }).getElement();
      input_staff.appendChild(no_preference);

      data.forEach((employee) => {
        let employee_option = new Element("option", {
          text: employee.firstName + " " + employee.lastName,
          attr: {
            value: employee._id,
          },
        }).getElement();
        input_staff.appendChild(employee_option);
      });
    }
  });
}

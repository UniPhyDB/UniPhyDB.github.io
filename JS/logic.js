function activeButton(buttonId) {
  var buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => button.classList.remove("activeBtnSection"));
  document.getElementById("tree_container").style.display = "none";
  document.getElementById("loader-heading").style.display = "block";
  var clickButton = document.getElementById(buttonId);
  clickButton.classList.add("activeBtnSection");

  const loaderTimeSet = setTimeout(showLoader, 1500);

  switch (buttonId) {
    case "plantBtn":
      break;
    case "fungiBtn":
      break;
    case "animalBtn":
      break;
    case "monocotBtn":
      break;
    case "dicotBtn":
      break;
    case "ascomycetesBtn":
      break;
    case "basidiomycetesBtn":
      break;
    case "arthropodsBtn":
      break;
    case "chordatesBtn":
      break;
  }
}

function showLoader () {
  document.getElementById("loader-heading").style.display = "none";
  document.getElementById("tree_container").style.display = "block";
}

function fileTypeDropDownBtn() {
  document
    .getElementById("myDropdownFileType")
    .classList.toggle("showFileTypeBtn");
  const dropDownFileTypeBtnId = document.getElementById("myDropdownFileType");
  dropDownFileTypeBtnId.style.display = dropDownFileTypeBtnId.style.display === "block" ? "none" : "block";
  if (dropDownFileTypeBtnId.style.display === "block") {
    document.querySelector(".dropDownFileTypeIcon").style.transform =
      "rotate(180deg)";
  } else {
    document.querySelector(".dropDownFileTypeIcon").style.transform =
      "rotate(0deg)";
  }
}

function LineageDropDownBtn() {
  document
    .getElementById("myDropdownLineage")
    .classList.toggle("showLineageBtn");
  const dropDownLineageBtnId = document.getElementById("myDropdownLineage");
  dropDownLineageBtnId.style.display =
  dropDownLineageBtnId.style.display === "block" ? "none" : "block";
  if (dropDownLineageBtnId.style.display === "block") {
    document.querySelector(".dropDownLineageIcon").style.transform =
      "rotate(180deg)";
  } else {
    document.querySelector(".dropDownLineageIcon").style.transform =
      "rotate(0deg)";
  }
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".dropBtnFileType")) {
    let dropdownsFileTypeBtnValue = document.getElementsByClassName(
      "dropdown-content-FileType"
    );
    document.querySelector(".dropDownFileTypeIcon").style.transform =
      "rotate(0deg)";
    for (let i = 0; i < dropdownsFileTypeBtnValue.length; i++) {
      let openDropdownFileTypeBtn = dropdownsFileTypeBtnValue[i];
      if (openDropdownFileTypeBtn.classList.contains("showFileTypeBtn")) {
        openDropdownFileTypeBtn.classList.remove("showFileTypeBtn");
        document.getElementById("myDropdownFileType").style.display = "none";
      }
    }
  }

  if (!event.target.matches(".dropBtnLineage")) {
    let dropdownsLineageBtnValue = document.getElementsByClassName(
      "dropdown-content-Lineage"
    );
    document.querySelector(".dropDownLineageIcon").style.transform =
      "rotate(0deg)";
    for (let i = 0; i < dropdownsLineageBtnValue.length; i++) {
      let openDropdownLineageBtn = dropdownsLineageBtnValue[i];
      if (openDropdownLineageBtn.classList.contains("showLineageBtn")) {
        openDropdownLineageBtn.classList.remove("showLineageBtn");
        document.getElementById("myDropdownLineage").style.display = "none";
      }
    }
  }
};



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
    case "chrodatesBtn":
      break;
  }
}

function showLoader () {
  document.getElementById("loader-heading").style.display = "none";
  document.getElementById("tree_container").style.display = "block";
}

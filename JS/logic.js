function activeButton (buttonId){
    
    var buttons = document.querySelectorAll(".btn");
    buttons.forEach( (button) => button.classList.remove("activeBtnSection", ) );

    var clickButton = document.getElementById(buttonId);
    clickButton.classList.add("activeBtnSection", )

    switch(buttonId){
        case "plantBtn": 
        alert("Plant Button is Active");
        break;
        case "fungiBtn" : 
        alert("Fungi Button is Active");
        break;
        case "animalBtn": 
        alert("Animal Button is Active");
        break;
        case "monocotBtn": 
        alert("Monocot Button is Active");
        break;
        case "dicotBtn": 
        alert("Dicot Button is Active");
        break;
        case "ascomycetesBtn": 
        alert("Ascomycetes Button is Active");
        break;
        case "basidiomycetesBtn": 
        alert("Basidiomycetes Button is Active");
        break;
        case "arthropodsBtn": 
        alert("Arthropods Button is Active");
        break;
        case "chrodatesBtn": 
        alert("Chrodates Button is Active");
        break;
    }

}

function myFunction() {
    document.getElementById("myDropdownFileType").classList.toggle("showFileTypeBtn");
  }
  
  // Close the dropdown if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.dropbtnFileType')) {
      var dropdowns = document.getElementsByClassName("dropdown-content-FileType");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('showFileTypeBtn')) {
          openDropdown.classList.remove('showFileTypeBtn');
        }
      }
    }
  }








var phylotree_extensions = new Object();

$("#newick_export_modal").on("show.bs.modal", function (e) {
  $('textarea[id$="nwk_export_spec"]').val(
    tree.getNewick(function (node) {
      var tags = [];
      selection_set.forEach(function (d) {
        if (node[d]) {
          tags.push(d);
        }
      });
      if (tags.length) {
        return "{" + tags.join(",") + "}";
      }
      return "";
    })
  );
});

$("#newick_file").on("change", function (e) {
  var files = e.target.files; // FileList object

  if (files.length == 1) {
    var f = files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
      var res = e.target.result;
      var warning_div = d3
        .select("#main_display")
        .insert("div", ":first-child");

      tree = new phylotree.phylotree(res);
      global_tree = tree;

      if (!tree["json"]) {
        warning_div
          .attr("class", "alert alert-danger alert-dismissable")
          .html(
            "<strong>Newick parser error for file " +
              f.name +
              ": </strong> In file " +
              res["error"]
          );
      } else {
        tree.render({
          container: "#tree_container",
          "draw-size-bubbles": false,
          "left-right-spacing": "fixed-step",
          "node-styler": node_colorizer,
          "edge-styler": edge_colorizer,
        });

        tree.display.selectionLabel(current_selection_name);

        // tree.display.countHandler(count => {
        //   $("#selected_branch_counter").text(function(d) {
        //     return count[current_selection_name];
        //   });
        // });

        // Get selection set names from parsed newick
        if (tree.parsed_tags.length) {
          selection_set = tree.parsed_tags;
        }

        update_selection_names();

        $("#newick_modal").modal("hide");

        $(tree.display.container).empty();
        $(tree.display.container).html(tree.display.show());
      }
    };

    $("#newick-dropdown").dropdown("toggle");

    reader.readAsText(f);
  }
});

function getNewickFromURL(url) {
  d3.text(url).then((res) => {
    var warning_div = d3.select("#main_display").insert("div", ":first-child");

    tree = new phylotree.phylotree(res);
    global_tree = tree;

    if (!tree["json"]) {
      warning_div
        .attr("class", "alert alert-danger alert-dismissable")
        .html(
          "<strong>Newick parser error for file " +
            f.name +
            ": </strong> In file " +
            res["error"]
        );
    } else {
      tree.render({
        container: "#tree_container",
        "draw-size-bubbles": false,
        "left-right-spacing": "fixed-step",
        "node-styler": node_colorizer,
        "edge-styler": edge_colorizer,
      });

      tree.display.selectionLabel(current_selection_name);

      tree.display.countHandler((count) => {
        $("#selected_branch_counter").text(function (d) {
          return count[current_selection_name];
        });
      });

      // Get selection set names from parsed newick
      if (tree.parsed_tags.length) {
        selection_set = tree.parsed_tags;
      }

      update_selection_names();

      $("#newick_modal").modal("hide");

      $(tree.display.container).empty();
      $(tree.display.container).html(tree.display.show());
    }
  });
}

$("#newick_url_btn").on("click", function (e) {
  let url = $("#newick_url").val();
  getNewickFromURL(url);
  $("#newick-dropdown").dropdown("toggle");
});

$("#newick_url").on("change", function (e) {
  let url = $(e.target).val();
  getNewickFromURL(url);

  $("#newick-dropdown").dropdown("toggle");
});

$("#display_tree").on("click", function (e) {
  tree.options({ branches: "straight" }, true);
});

$("#mp_label").on("click", function (e) {
  tree.maxParsimony(true, "Foreground");
});

$("[data-direction]").on("click", function (e) {
  var which_function =
    $(this).data("direction") == "vertical"
      ? tree.display.spacing_x.bind(tree.display)
      : tree.display.spacing_y.bind(tree.display);
  which_function(which_function() + +$(this).data("amount")).update();
});

$(".phylotree-layout-mode").on("click", function (e) {
  if (tree.display.radial() != ($(this).data("mode") == "radial")) {
    $(".phylotree-layout-mode").toggleClass("active");
    tree.display.radial(!tree.display.radial()).update();
  }
});

$("#toggle_animation").on("click", function (e) {
  var current_mode = $(this).hasClass("active");
  $(this).toggleClass("active");
  tree.options({ transitions: !current_mode });
});

$(".phylotree-align-toggler").on("click", function (e) {
  var button_align = $(this).data("align");
  var tree_align = tree.display.options.alignTips;

  if (tree_align != button_align) {
    tree.display.alignTips(button_align == "right");
    $(".phylotree-align-toggler").toggleClass("active");
    tree.display.update();
  }
});

function sort_nodes(asc) {
  tree.resortChildren(function (a, b) {
    return (b.height - a.height || b.value - a.value) * (asc ? 1 : -1);
  });
}

$("#sort_original").on("click", function (e) {
  tree.resortChildren(function (a, b) {
    return a["original_child_order"] - b["original_child_order"];
  });
});

$("#sort_ascending").on("click", function (e) {
  sort_nodes(true);
  tree.display.update();
});

$("#sort_descending").on("click", function (e) {
  sort_nodes(false);
  tree.display.update();
});

$("#and_label").on("click", function (e) {
  tree.display.internalLabel(function (d) {
    return d.reduce(function (prev, curr) {
      return curr[current_selection_name] && prev;
    }, true);
  }, true);
});

$("#or_label").on("click", function (e) {
  tree.display.internalLabel(function (d) {
    return d.reduce(function (prev, curr) {
      return curr[current_selection_name] || prev;
    }, false);
  }, true);
});

$("#filter_add").on("click", function (e) {
  tree.display
    .modifySelection(function (d) {
      return d.tag || d[current_selection_name];
    })
    .modifySelection(
      function (d) {
        return false;
      },
      "tag",
      false,
      false
    );
});

$("#filter_remove").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return !d.tag;
  });
});

$("#select_all").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return true;
  });
});

$("#select_all_internal").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return !tree.isLeafNode(d.target);
  });
});

$("#select_all_leaves").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return tree.isLeafNode(d.target);
  });
});

$("#select_none").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return false;
  });
});

$("#clear_internal").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return tree.isLeafNode(d.target) ? d.target[current_selection_name] : false;
  });
});

$("#clear_leaves").on("click", function (e) {
  tree.display.modifySelection(function (d) {
    return !tree.isLeafNode(d.target)
      ? d.target[current_selection_name]
      : false;
  });
});

$("#display_dengrogram").on("click", function (e) {
  tree.display.options({ branches: "step" }, true);
});

$("#branch_filter").on("input propertychange", function (e) {
  var filter_value = $(this).val();

  var rx = new RegExp(filter_value, "i");

  tree.display.modifySelection((n) => {
    if (!n.target.data.name) {
      return false;
    }
    m = n.target.data.name.search(rx);
    return filter_value.length && m != -1;
  }, "tag");
});

$("#validate_newick").on("click", function (e) {
  let test_string = $('textarea[id$="nwk_spec"]').val();

  tree = new phylotree.phylotree(test_string);
  global_tree = tree;

  if (!tree["json"]) {
    var warning_div = d3
      .select("#newick_body")
      .selectAll("div  .alert-danger")
      .data([res["error"]]);
    warning_div.enter().append("div");
    warning_div
      .html(function (d) {
        return d;
      })
      .attr("class", "alert-danger");
  } else {
    tree.render({
      container: "#tree_container",
      "draw-size-bubbles": false,
      "node-styler": node_colorizer,
      zoom: false,
      "edge-styler": edge_colorizer,
    });

    tree.display.selectionLabel(current_selection_name);

    tree.display.countHandler((count) => {
      $("#selected_branch_counter").text(function (d) {
        return count[current_selection_name];
      });
    });

    // Get selection set names from parsed newick
    if (tree.parsed_tags.length) {
      selection_set = tree.parsed_tags;
    }

    update_selection_names();

    $("#newick_modal").modal("hide");
    $(tree.display.container).html(tree.display.show());
  }
});

function default_tree_settings() {
  tree = phylotree();
  tree.branchLength(null);
  tree.branchName(null);
  tree.display.radial(false).separation(function (a, b) {
    return 0;
  });
}

function node_colorizer(element, data) {
  try {
    var count_class = 0;

    selection_set.forEach(function (d, i) {
      if (data[d]) {
        count_class++;
        element.style(
          "fill",
          color_scheme(i),
          i == current_selection_id ? "important" : null
        );
      }
    });

    if (count_class > 1) {
    } else {
      if (count_class == 0) {
        element.style("fill", null);
      }
    }
  } catch (e) {}
}

function edge_colorizer(element, data) {
  try {
    var count_class = 0;

    selection_set.forEach(function (d, i) {
      if (data[d]) {
        count_class++;
        element.style(
          "stroke",
          color_scheme(i),
          i == current_selection_id ? "important" : null
        );
      }
    });

    if (count_class > 1) {
      element.classed("branch-multiple", true);
    } else if (count_class == 0) {
      element.style("stroke", null).classed("branch-multiple", false);
    }
  } catch (e) {}
}

var valid_id = new RegExp("^[\\w]+$");

$("#selection_name_box").on("input propertychange", function (e) {
  var name = $(this).val();

  var accept_name = selection_set.indexOf(name) < 0 && valid_id.exec(name);

  d3.select("#save_selection_button").classed(
    "disabled",
    accept_name ? null : true
  );
});

$("#selection_rename").on("click", function (e) {
  d3.select("#save_selection_button")
    .classed("disabled", true)
    .on("click", function (e) {
      // save selection handler
      var old_selection_name = current_selection_name;
      selection_set[current_selection_id] = current_selection_name = $(
        "#selection_name_box"
      ).val();

      if (old_selection_name != current_selection_name) {
        tree.update_key_name(old_selection_name, current_selection_name);
        update_selection_names(current_selection_id);
      }
      send_click_event_to_menu_objects(
        new CustomEvent(selection_menu_element_action, {
          detail: ["save", this],
        })
      );
    });

  d3.select("#cancel_selection_button")
    .classed("disabled", false)
    .on("click", function (e) {
      // save selection handler
      $("#selection_name_box").val(current_selection_name);
      send_click_event_to_menu_objects(
        new CustomEvent(selection_menu_element_action, {
          detail: ["cancel", this],
        })
      );
    });

  send_click_event_to_menu_objects(
    new CustomEvent(selection_menu_element_action, {
      detail: ["rename", this],
    })
  );
  e.preventDefault();
});

$("#selection_delete").on("click", function (e) {
  tree.display.updateKeyName(selection_set[current_selection_id], null);
  selection_set.splice(current_selection_id, 1);

  if (current_selection_id > 0) {
    current_selection_id--;
  }
  current_selection_name = selection_set[current_selection_id];
  update_selection_names(current_selection_id);
  $("#selection_name_box").val(current_selection_name);

  send_click_event_to_menu_objects(
    new CustomEvent(selection_menu_element_action, {
      detail: ["save", this],
    })
  );
  e.preventDefault();
});

$("#selection_new").on("click", function (e) {
  d3.select("#save_selection_button")
    .classed("disabled", true)
    .on("click", function (e) {
      // save selection handler
      current_selection_name = $("#selection_name_box").val();
      current_selection_id = selection_set.length;
      selection_set.push(current_selection_name);
      update_selection_names(current_selection_id);
      send_click_event_to_menu_objects(
        new CustomEvent(selection_menu_element_action, {
          detail: ["save", this],
        })
      );
    });

  d3.select("#cancel_selection_button")
    .classed("disabled", false)
    .on("click", function (e) {
      // save selection handler
      $("#selection_name_box").val(current_selection_name);
      send_click_event_to_menu_objects(
        new CustomEvent(selection_menu_element_action, {
          detail: ["cancel", this],
        })
      );
    });

  send_click_event_to_menu_objects(
    new CustomEvent(selection_menu_element_action, {
      detail: ["new", this],
    })
  );
  e.preventDefault();
});

function send_click_event_to_menu_objects(e) {
  $(
    "#selection_new, #selection_delete, #selection_rename, #save_selection_name, #selection_name_box, #selection_name_dropdown"
  )
    .get()
    .forEach(function (d) {
      d.dispatchEvent(e);
    });
}

function update_selection_names(id, skip_rebuild) {
  skip_rebuild = skip_rebuild || false;
  id = id || 0;

  current_selection_name = selection_set[id];
  current_selection_id = id;

  if (!skip_rebuild) {
    d3.selectAll(".selection_set").remove();

    d3.select("#selection_name_dropdown")
      .selectAll(".selection_set")
      .data(selection_set)
      .enter()
      .append("a")
      .attr("class", "selection_set dropdown-item")
      .attr("href", "#")
      .text(function (d) {
        return d;
      })
      .style("color", function (d, i) {
        return color_scheme(i);
      })
      .on("click", function (d, name) {
        // Pass the index of name
        let i = _.indexOf(selection_set, name);
        update_selection_names(i, true);
      });
  }

  d3.select("#selection_name_box")
    .style("color", color_scheme(id))
    .property("value", current_selection_name);

  // Loop through all selection_sets
  _.each(selection_set, function (id) {
    tree.display.selectionLabel(id);
    tree.display.update();
  });

  //console.log('Setting label within the tree display');
  //console.log(id);
  //console.log(selection_set[id]);
  tree.display.selectionLabel(selection_set[id]);
  tree.display.update();
}

var width = 800, //$(container_id).width(),
  height = 800, //$(container_id).height()
  selection_set = ["Foreground"],
  current_selection_name = $("#selection_name_box").val(),
  current_selection_id = 0,
  max_selections = 10;
(color_scheme = d3.scaleOrdinal(d3.schemeCategory10)),
  (selection_menu_element_action = "phylotree_menu_element_action");

var test_string =
  "(((EELA:0.150276,CONGERA:0.213019):0.230956,(EELB:0.263487,CONGERB:0.202633):0.246917):0.094785,((CAVEFISH:0.451027,(GOLDFISH:0.340495,ZEBRAFISH:0.390163):0.220565):0.067778,((((((NSAM:0.008113,NARG:0.014065):0.052991,SPUN:0.061003,(SMIC:0.027806,SDIA:0.015298,SXAN:0.046873):0.046977):0.009822,(NAUR:0.081298,(SSPI:0.023876,STIE:0.013652):0.058179):0.091775):0.073346,(MVIO:0.012271,MBER:0.039798):0.178835):0.147992,((BFNKILLIFISH:0.317455,(ONIL:0.029217,XCAU:0.084388):0.201166):0.055908,THORNYHEAD:0.252481):0.061905):0.157214,LAMPFISH:0.717196,((SCABBARDA:0.189684,SCABBARDB:0.362015):0.282263,((VIPERFISH:0.318217,BLACKDRAGON:0.109912):0.123642,LOOSEJAW:0.397100):0.287152):0.140663):0.206729):0.222485,(COELACANTH:0.558103,((CLAWEDFROG:0.441842,SALAMANDER:0.299607):0.135307,((CHAMELEON:0.771665,((PIGEON:0.150909,CHICKEN:0.172733):0.082163,ZEBRAFINCH:0.099172):0.272338):0.014055,((BOVINE:0.167569,DOLPHIN:0.157450):0.104783,ELEPHANT:0.166557):0.367205):0.050892):0.114731):0.295021)myroot";
var container_id = "#tree_container";

var monocot_string = `(((((((((((((((Brachypodium_distachyon:0.0849582474,((((Lolium_perenne:0.0561114,Dactylis_glomerata:0.0474446212):0.0094375673,Avena_atlantica:0.0609142082):0.0085801776,(Puccinellia_tenuiflora:0.0570309045,Alopecurus_myosuroides:0.0476846086):0.0151689354):0.0328842793,\
(((((Triticum_aestivum:0.0160996315,Aegilops_longissima:0.0186609695):0.0040117182,Thinopyrum_elongatum:0.0173858017):0.0091759539,Secale_cereale:0.0247360607):0.0070864029,Hordeum_marinum:0.0339445985):0.0224528796,Bromus_sterilis:0.0560077413):0.0459503594):0.0263177099):0.0314820587,Stipa_capillata:0.0534628353):0.0575508802,\
(Raddia_distichophylla:0.1321455145,(Dendrocalamus_latiflorus:0.0542068111,Phyllostachys_edulis:0.0523330804):0.0072281857):0.0138506988):0.0119969502,((Oryza_rufipogon:0.0547526117,Leersia_perrieri:0.0674979716):0.0293772492,Zizania_palustris:0.0896472603):0.0657338647):0.0153925267,\
((((((Digitaria_exilis:0.070810242,(Urochloa_ruziziensis:0.0778106383,(Setaria_italica:0.0224833635,Cenchrus_purpureus:0.0420388245):0.0165215973):0.0075921314):0.003829547,Panicum_virgatum:0.0550064569):0.0043532769,((Dichanthelium_oligosanthes:0.0491219959,Alloteropsis_semialata:0.0623314082):0.0078797127,Echinochloa_crus-galli:0.0590294788):0.0022932076):0.0204031955,(Paspalum_notatum:0.0848898774,\
(((((Sorghum_bicolor:0.0287074438,(Saccharum_officinarum:0.0225616955,Miscanthus_lutarioriparius:0.0245230792):0.004518425):0.0019243504,(Hyparrhenia_diplandra:0.0435459741,(Bothriochloa_decipiens:0.0344477461,Themeda_triandra:0.0342233498):0.0065586951):0.0054244419):0.0038553516,\
(Coix_aquatica:0.0371500485,Microstegium_vimineum:0.0450427791):0.0032308117):0.0025733388,Zea_luxurians:0.062839795):0.0037746148,Chrysopogon_serrulatus:0.036112017):0.0470380045):0.0130874386):0.0381048476,Phragmites_australis_subsp._australis:0.081919955):0.0076076168,(Eragrostis_curvula:0.0670798605,\
((Oropetium_thomaeum:0.0824139343,Eleusine_coracana_subsp._coracana:0.0663406094):0.0081409151,Zoysia_pacifica:0.0920509922):0.0171964584):0.0509018188):0.057907841):0.0780600768,Pharus_latifolius:0.1272981816)f_Poaceae:0.2893718824,(((Carex_myosuroides:0.1134383808,Cyperus_esculentus:0.1547049262):0.0262616527,Rhynchospora_pubera:0.1230900658)\
f_Cyperaceae:0.1460320029,(Luzula_sylvatica:0.2127008442,Juncus_effusus:0.2016943756)f_Juncaceae:0.1753276654):0.2594646736):0.0802511335,((Puya_raimondii:0.0299636674,Ananas_comosus:0.0388758836):0.0159632056,Tillandsia_fasciculata:0.0549219928)f_Bromeliaceae:0.1883825014):0.025257578,Typha_latifolia:0.2256400662)o_Poales:0.1054491429,\
((((Musa_beccarii:0.0331577099,Ensete_glaucum:0.0439773089)f_Musaceae:0.119766994,(Costus_lasius:0.2028413865,(Wurfbainia_villosa:0.053433496,(Zingiber_officinale:0.0341793489,Boesenbergia_rotunda:0.0389568755):0.0207258425)f_Zingiberaceae:0.2025669427):0.0433026517)o_Zingiberales:0.1128650688,Pontederia_paniculata:0.3450617822):0.0754031434,(((Areca_catechu:0.0694758918,\
(Elaeis_guineensis:0.0413716807,Cocos_nucifera:0.0509085617):0.0141638349):0.0132115342,Phoenix_dactylifera:0.0671218685):0.0351391906,(Calamus_simplicifolius:0.03942083,Metroxylon_sagu:0.021501033):0.0710204844)o_Arecales:0.1024082361):0.020953372):0.0531892311,(((((Asparagus_officinalis:0.2229513315,(Agapanthus_africanus:0.1657618305,Allium_cepa:0.4032873721)\
f_Amaryllidaceae:0.0354884808):0.0346194727,Hemerocallis_citrina:0.2772990927):0.0679376829,Iris_pallida:0.2797323554):0.0760455011,(((((Cymbidium_sinense:0.1134067426,(Papilionanthe_hookeriana_x_Papilionanthe_teres:0.0439142437,Phalaenopsis_aphrodite:0.0428223099):0.1011443738):0.0179890368,Dendrobium_officinale:0.1032254735):0.0419765513,Gastrodia_elata_f._glauca:0.2867079549):0.0924462445,Vanilla_planifolia:0.3385355942):0.0312889294,Apostasia_shenzhenica:0.2699919007)\
f_Orchidaceae:0.2156550491)o_Asparagales:0.0299441266,Chionographis_japonica:0.2617284722):0.0124360627):0.0265430349,((Trichopus_zeylanicus_subsp._travancoricus:0.2540284021,Dioscorea_dumetorum:0.2697083699)o_Dioscoreales:0.1238793087,(Acanthochlamys_bracteata:0.2830932964,Xerophyta_viscosa:0.2561152407)o_Pandanales:0.2198630766):0.0362122362):0.0939129254,\
(((Amorphophallus_konjac:0.0993192124,Colocasia_esculenta:0.1323040546):0.0875934938,(Spirodela_intermedia:0.1296350534,(Wolffia_australiana:0.3218262754,Lemna_minuta:0.2745979095):0.1149696859):0.1928213013)f_Araceae:0.1775017449,(Amphibolis_antarctica:0.3392978967,Zostera_marina:0.4571503689):0.2052265542)o_Alismatales:0.0586079018):0.1114990439):0.1399124045,(Nymphaea_colorata:0.2261374412,Brasenia_schreberi:0.2494388967)o_Nymphaeales:0.3164062794)
`;

var arthopods_string = 
` ((((((((((((((((Schistocerca_serialis_cubense:0.0244623214,Xenocatantops_brachycerus:0.0290719135)f_Acrididae:0.1497560383,Vandiemenella_viatica:0.189411634):0.2273366459,((Teleogryllus_occipitalis:0.0213568678,Gryllus_bimaculatus:0.0207719703):0.1388990056,Laupala_kohalensis:0.2050379625)f_Gryllidae:0.2462805624)o_Orthoptera:0.0428167123,\
((((Clitarchus_hookeri:0.040766683,Dryococelus_australis:0.0390597214)f_Phasmatidae:0.2833591084,Timema_monikensis:0.2391100211)o_Phasmatodea:0.1302312442,(((Periplaneta_americana:0.1257186384,((Cryptotermes_secundus:0.088566015,(Reticulitermes_speratus:0.0378852188,Coptotermes_formosanus:0.0346342375)f_Rhinotermitidae:0.0641358801):0.0133991872,Zootermopsis_nevadensis:0.103698045):0.049218916):0.0391062061,Diploptera_punctata:0.1982671398)\
o_Blattodea:0.0601575507,Tenodera_sinensis:0.2511373433):0.0791211489):0.0264100014,((Sweltsa_coloradensis:0.086501887,Isoperla_grammatica:0.0845308276):0.162369989,(Leuctra_nigra:0.2105778106,(Brachyptera_putata:0.1550697995,((Nemoura_dubitans:0.0535798406,Protonemura_montana:0.066188015):0.0492056985,Nemurella_pictetii:0.0991514528)f_Nemouridae:0.2250026348):0.0272882059):0.0733213166)o_Plecoptera:0.1770724521):0.0312923277):0.0430375056,\
(Forficula_auricularia:0.2184719091,(Euborellia_annulipes:0.0494042976,Anisolabis_maritima:0.0666750105)f_Anisolabididae:0.1303961413)o_Dermaptera:0.5053484357):0.0483067332,((((((((((((Agriotes_lineatus:0.1507234256,((Agrypnus_murinus:0.0946211854,Ignelater_luminosus:0.0688341195):0.0724792606,Limonius_californicus:0.1101608923):0.0292086471)f_Elateridae:0.024996295,\
(((Podabrus_alpinus:0.0487709835,Rhagonycha_fulva:0.0584660821):0.0118680191,Cantharis_rufa:0.0398807797):0.2441021291,Malthinus_flaveolus:0.2128895167)f_Cantharidae:0.1211504056):0.0229062214,Photinus_pyralis:0.3030391532):0.0849062835,Elmis_aenea:0.2465563522):0.0285513649,Agrilus_cyanescens:0.4359385983):0.0268579846,Dascillus_cervinus:0.3378237859):0.037200076,\
(((((((((((Diabrotica_virgifera_virgifera:0.1477669934,(((Lochmaea_crataegi:0.0680296525,Ophraella_communa:0.0949637524):0.0154584145,Diorhabda_carinata:0.0857836815):0.0826895651,Agelastica_alni:0.149657325):0.0164867575):0.0396147196,((Psylliodes_chrysocephala:0.0880607952,Crepidodera_aurea:0.0881493139):0.0273745954,Phyllotreta_cruciferae:0.1912238771):0.0610740274):0.10441101,\
((Gonioctena_quinquepunctata:0.1120068073,Leptinotarsa_decemlineata:0.1517765085):0.0641699838,(Phaedon_cochleariae:0.0766422604,(Chrysomela_aeneicollis:0.0758404232,Plagiodera_versicolora:0.1008651864):0.0453288446):0.126147225):0.0317068546):0.0385487319,((Acanthoscelides_obtectus:0.0826076042,Callosobruchus_chinensis:0.076683218):0.2105249546,Cryptocephalus_moraei:0.311382752):0.0364878852):0.03419086,\
(((Rutpela_maculata:0.0748382399,Rhamnusium_bicolor:0.0794075467):0.0527256412,((Anoplophora_glabripennis:0.0494666746,Monochamus_saltuarius:0.0591702792):0.046497381,Exocentrus_adspersus:0.1451423392):0.0667125506):0.0167955374,(Aromia_moschata:0.1233425894,Molorchus_minor:0.1582963326):0.0458412511)f_Cerambycidae:0.0390062513):0.0535761029,\
((((((Pachyrhynchus_sulphureomaculatus:0.1091783033,Polydrusus_cervinus:0.1084376042):0.0184245519,Listronotus_bonariensis:0.0991500579):0.0477324297,((Pissodes_strobi:0.1429960987,(Anthonomus_grandis_thurberiae:0.2236737622,Ceutorhynchus_assimilis:0.194005822):0.0229371566):0.0108873167,(Dendroctonus_ponderosae:0.2571065322,(Ips_typographus:0.2154454379,Hypothenemus_hampei:0.2383006508):0.0285899512):0.0301671274):0.0596888697):0.0343192694,\
((Rhynchophorus_ferrugineus:0.1783669812,Sitophilus_oryzae:0.1737218319):0.052446421,Platypus_cylindrus:0.4138858462):0.0320335974)f_Curculionidae:0.073654137,Cylas_formicarius:0.2885360557):0.0646477048,Apoderus_coryli:0.3235450624):0.064880371):0.0333297151,((Brassicogethes_aeneus:0.1838203256,Aethina_tumida:0.179967197)f_Nitidulidae:0.1452797904,Oryzaephilus_surinamensis:0.313630109):0.0265144361):0.0539232103,(Anaspis_maculata:0.301625372,\
(((((((Zophobas_atratus:0.1097551048,Cynaeus_angustus:0.1137681059):0.0213681752,Latheticus_oryzae:0.1575124454):0.0271686647,Tribolium_castaneum:0.1382800705):0.0176521785,Tenebrio_molitor:0.1178843977):0.0237985294,Asbolus_verrucosus:0.1129010319):0.0293058293,Lagria_hirta:0.2790952592)f_Tenebrionidae:0.0571653229,((Pyrochroa_serraticornis:0.1844113308,Salpingus_planirostris:0.2572155992):0.0283991484,\
((Epicauta_chinensis:0.0984984619,Meloe_dianella:0.0962693035):0.0235970758,(Mylabris_phalerata:0.0102986641,Hycleus_cichorii:0.0115140926):0.0900383342)f_Meloidae:0.215099415):0.0234621872):0.0185272253):0.0875645504):0.0204021728,(((Cryptolaemus_montrouzieri:0.1572153519,((Halyzia_sedecimguttata:0.0749848632,Propylea_japonica:0.0773233671):0.0333636409,(Harmonia_axyridis:0.1296070958,\
(Coccinella_septempunctata:0.0826961379,Adalia_bipunctata:0.1187623758):0.0223507672):0.0183214503):0.1611659042):0.0399844776,Novius_pumilus:0.3069915001)f_Coccinellidae:0.2353214632,Malachius_bipustulatus:0.4350850238):0.0421131848):0.0750853491,Rhyzopertha_dominica:0.3580527203):0.040144815,((((Melolontha_melolontha:0.1369531987,\
(((Holotrichia_oblita:0.0454835532,Popillia_japonica:0.0380156854):0.0758122949,(Trypoxylus_dichotomus:0.0691837941,(Marronus_borbonicus:0.0240545734,Oryctes_rhinoceros:0.0197487764):0.0488200534):0.0533449908):0.0376572526,(Protaetia_brevitarsis:0.0406651302,Cetonia_aurata:0.0451074488):0.107324937):0.0306140413):0.1084186837,Onthophagus_taurus:0.3468774859)\
f_Scarabaeidae:0.0546312079,Lethrus_apterus:0.2350735239):0.0967324508,((((((Phosphuga_atrata:0.2062266026,Nicrophorus_vespilloides:0.2643954429):0.0665323247,(Tachinus_sp._AB-2021:0.1776144793,Coproporus_ventriculus:0.1899662311):0.0739506821):0.0204083979,(Ocypus_olens:0.1132515749,Philonthus_cognatus:0.1289464983):0.1532065314):0.0241089145,(((((((Weissflogia_rhopalogaster:0.1562318751,\
(((Atheta_pasadenae:0.1233489225,Dalotia_coriaria:0.0899653678):0.0124405306,(Ecitophya_simulans:0.1571621941,Tetradonia_laticeps:0.1607074339):0.0213747628):0.017239132,((Earota_dentata:0.0607883752,Geostiba_sp._GC000077:0.0616482058):0.0362990678,Aenictocupidus_jacobsonorum:0.1273168306):0.0342854429):0.0191163263):0.0700537096,Lissagria_laeviuscula:0.1592200673):0.0273780942,Myllaena_sp._GC000078:0.2781163768):0.0231464742,\
(Liometoxenus_newtonarum:0.1440846482,Leptusa_sp._GC000079:0.1710863352):0.0209186871):0.0193682646,Aleochara_sp._GC000083:0.1912091547):0.0376449351,Labidoglobus_nevermanni:0.3423695546):0.1926848026,(Adinopsis_sp._GC000173:0.2115114321,Deinopsis_erosa:0.1922649869):0.1542770805):0.0344914593):0.0465881157,Adranes_taylori:0.502279095)f_Staphylinidae_-5:0.0547274708,Leptodirus_hochenwartii:0.5687351635):0.04432567):0.036200089):0.0260268475):0.16009083,\
(((((Ophonus_ardosiacus:0.0287802673,Harpalus_rufipes:0.0319672139):0.1016769476,Agonum_fuliginosum:0.1012542599):0.0174452549,Pterostichus_niger:0.0898252347):0.071038194,Pogonus_chalceus:0.1600262432):0.0383916377,((Nebria_salina:0.0891129666,Leistus_spinibarbis:0.0893992067):0.1327206824,Calosoma_granatense:0.1322505928):0.0279813899)f_Carabidae:0.2059418204):0.1071835885,((Neoneuromus_ignobilis:0.3160874828,Sialis_lutaria:0.323711072)o_Megaloptera:0.0751302149,\
(Chrysoperla_carnea:0.0326545288,Chrysopa_pallens:0.0416283679)o_Neuroptera:0.3602120997):0.1480788392):0.0862359332,(((((((((((((((((((((((Euclidia_mi:0.0497573588,Catocala_fraxini:0.0420354484):0.0241849192,(Schrankia_costaestrigalis:0.1082871498,(Trisateles_emortualis:0.0656538454,Laspeyria_flexula:0.0601814193):0.0202582823):0.0108346243):0.0089905365,Hypena_proboscidalis:0.1057105586):0.0058063696,((((Miltochrista_miniata:0.0413856095,Thumatha_senex:0.039719015):0.0579126398,(Cybosia_mesomella:0.0301476324,Eilema_caniola:0.031474451):0.0324601349):0.0167133156,\
((((((((Diaphora_mendica:0.0148368896,Spilosoma_lubricipeda:0.0151274661):0.0047354819,Spilarctia_lutea:0.0293112143):0.0018873982,Hyphantria_cunea:0.0264800858):0.0104181743,Phragmatobia_fuliginosa:0.0373713399):0.0073962118,Hypercompe_scribonia:0.0301966809):0.0112839913,Arctia_plantaginis:0.0238518966):0.0227484104,Callimorpha_dominula:0.0339440546):0.0062635529,Tyria_jacobaeae:0.0452028141):0.0280527285):0.0188401299,Herminia_tarsipennalis:0.0739471526):0.0177032063):0.0085867104,\
((Lymantria_monacha:0.0701718594,Leucoma_salicis:0.0764314859):0.0158599812,(Euproctis_similis:0.1136886566,Orgyia_antiqua:0.0830821922):0.0138186884):0.032742609):0.0393103602,(((((((((((((Tholera_decimalis:0.0383888879,((Lacanobia_wlatinum:0.0168870225,(Melanchra_persicariae:0.017659143,Mamestra_configurata:0.0198421626):0.0017759627):0.0011306007,Hecatera_dysodea:0.0208324222):0.0082793612):0.0030534188,(Polia_nebulosa:0.0258518911,Mythimna_albipuncta:0.0309999717):0.0045310121):0.0028665569,(Orthosia_incerta:0.0089251401,Anorthoa_munda:0.0104359227):0.0300833878):0.0110649142,\
((((((Xestia_c-nigrum:0.0209940243,Lycophotia_porphyrea:0.0184270993):0.0027373266,(Eugnorisma_glareosa:0.0153987695,(Eurois_occulta:0.0121150644,Noctua_janthe:0.0163428582):0.0012661553):0.0012952214):0.0041824369,Diarsia_rubi:0.0350474599):0.0036817952,Cerastis_rubricosa:0.0245474964):0.0055881833,Ochropleura_plecta:0.0299612189):0.0091698613,Agrotis_puta:0.0341589843):0.0167980105):0.0035926164,(((((((((Sesamia_nonagrioides:0.0341961003,Busseola_fusca:0.0292035067):0.0114378206,Apamea_sordens:0.0117531711):0.0046892974,Globia_sparganii:0.0126466131):0.0008756171,\
(((Mesoligia_furuncula:0.0086730077,Oligia_latruncula:0.0094125818):0.0013849903,Luperina_testacea:0.0117080828):0.0027274848,(Amphipoea_lucens:0.0109822121,Hydraecia_micacea:0.0079450175):0.0041121078):0.0016583843):0.0008970778,Eremobia_ochroleuca:0.0210227612):0.0098548049,(Brachylomia_viminalis:0.0220384698,(Griposia_aprilina:0.0109659245,Dryobotodes_eremita:0.0079182644):0.006872943):0.0046769473):0.0012283742,(Aporophyla_nigra:0.0250337782,\
(Polymixis_lichenea:0.0114380318,Antitype_chi:0.0124498445):0.010710996):0.0129941685):0.0026305954,(((Dicycla_oo:0.0179481101,Cosmia_pyralina:0.0130703339):0.0028310825,Fissipunctia_ypsillon:0.0167433399):0.0017926446,(((Atethmia_centrago:0.0200618016,Tiliacea_aurago:0.0187292923):0.0033978624,Dryobota_labecula:0.0155103614):0.001937924,((((Conistra_vaccinii:0.0136654205,(Xanthia_icteritia:0.0129798679,Agrochola_circellaris:0.0129659848):0.0016524088):0.0021263858,Omphaloscelis_lunosa:0.0159041671):0.0029728061,Lithophane_ornitopus:0.0171312224):0.0015160945,Eupsilia_transversa:0.015284226):0.0031163821):0.0006387795):0.0017365815):0.0126528789,(Euplexia_lucipara:0.0329000498,Phlogophora_meticulosa:0.0425141003):0.0177071673):0.0029859043):0.0071410085,\
(Charanyca_ferruginea:0.0358379141,(Hoplodrina_ambigua:0.019537331,Caradrina_kadenii:0.0313285075):0.0106047082):0.0179914529):0.0210095713,Thalpophila_matura:0.0448158748):0.0063030324,((Heliothis_subflexa:0.02520865,Helicoverpa_assulta:0.0183917256):0.0378453697,Spodoptera_littoralis:0.0775028182):0.0103433882):0.0169145681,((Asteroscopus_sphinx:0.0493098994,Amphipyra_tragopoginis:0.0374402915):0.0109202535,Xylocampa_areola:0.0614405767):0.0047480925):0.0040742899,(Acronicta_aceris:0.0385528858,Craniophora_ligustri:0.0480889813):0.0262424039):0.0116473744,\
(Diloba_caeruleocephala:0.0686736802,(Allophyes_oxyacanthae:0.032522748,Shargacucullia_verbasci:0.0283483249):0.0231533239):0.0067869106):0.0084518419,(((Autographa_pulchrina:0.0254562496,(Plusia_festucae:0.0316509958,Diachrysia_chrysitis:0.0214604371):0.0030491922):0.0084056016,(Chrysodeixis_includens:0.0269049125,Trichoplusia_ni:0.0266687548):0.020240864):0.0370206473,Abrostola_triplasia:0.0503643163):0.0343374428):0.0077234317,Protodeltote_pygarga:0.0831116285):0.0267443732)\
f_Noctuidae_-1:0.0079352533,((Pseudoips_prasinana:0.0621142519,Nycteola_revayana:0.0680772917):0.0338230023,Meganola_albula:0.1157156268)f_Nolidae:0.0310502031):0.0221482634,((((Phalera_bucephala:0.0617646742,Thaumetopoea_pityocampa:0.1090477017):0.0138577485,(((Drymonia_ruficornis:0.0365342165,Notodonta_dromedarius:0.0367137132):0.0126385619,Ptilodon_capucinus:0.0650606603):0.0110680284,Pheosia_gnoma:0.0612063159):0.0297585129):0.0086125693,Furcula_furcula:0.088813515):0.0197890954,Clostera_curtula:0.1473379595)f_Notodontidae:0.0208984032):0.0367406773,\
((((((Selenia_dentaria:0.0522371702,Apeira_syringaria:0.0703467157):0.0375538541,Petrophora_chlorosata:0.0671884265):0.0080849478,(((Alsophila_aescularia:0.0538392678,(Campaea_margaritaria:0.044802355,Hylaea_fasciaria:0.0510659642):0.0268116992):0.0230054368,Lomographa_bimaculata:0.1009565063):0.007647212,((Ennomos_fuscantarius:0.0802352652,Crocallis_elinguaria:0.0750315134):0.0104878069,Opisthograptis_luteolata:0.0818777196):0.0084698837):0.0050303956):0.0084306095,\
(((Ectropis_grisescens:0.0835762668,Lycia_hirtaria:0.0609435918):0.0080669384,(((Hypomecis_punctinalis:0.0588339733,(Peribatodes_rhomboidaria:0.0436352605,Alcis_repandata:0.0560036309):0.0203755165):0.0053643074,(Agriopis_aurantiaria:0.0501019972,Apocheima_hispidaria:0.0448257958):0.0055806992):0.004360695,(Erannis_defoliaria:0.0446595099,Biston_stratarius:0.045827611):0.0170548266):0.0048095316):0.0173526362,\
(Ligdia_adustata:0.0708606008,Macaria_notata:0.103634296):0.0188861572):0.0333122817):0.0291811126,(Hemithea_aestivaria:0.0548856733,Hemistola_chrysoprasaria:0.0606632047):0.0706208568):0.0423645766,((((((Philereme_vetulata:0.0715129866,(Operophtera_brumata:0.0354908405,Epirrita_christyi:0.0299696758):0.0272755194):0.0065187204,((Lampropteryx_suffumata:0.0612519911,Colostygia_pectinataria:0.0565497345):0.0144879837,((((Chloroclysta_siterata:0.0327768303,Thera_obeliscata:0.0436217904):0.0099846124,Electrophaes_corylata:0.042865749):0.0156808654,\
(Ecliptopera_silaceata:0.0432245285,(Gandaritis_pyraliata:0.0239176763,Eulithis_prunata:0.0288246754):0.0075532573):0.0168726779):0.0282938598,((Hydriomena_furcata:0.0558074509,Anticlea_derivata:0.0385463022):0.007925894,((Epirrhoe_tristata:0.0408842261,Xanthorhoe_spadicearia:0.0415536876):0.0284046972,Scotopteryx_bipunctaria:0.0586065915):0.0114477353):0.0050937156):0.0040350741):0.014509569):0.008337191,(Venusia_cambrica:0.1179322789,(Gymnoscelis_rufifasciata:0.0937372821,Eupithecia_insigniata:0.0648785696):0.0553814819):0.0109764584):0.019123661,Lobophora_halterata:0.1049054407):0.0133634787,\
(Chesias_legatella:0.0634955366,Aplocera_efformata:0.0767622782):0.0403366154):0.0675843531,(Idaea_straminata:0.1281001464,Cyclophora_punctaria:0.1483350779):0.0334219874):0.0137137539)f_Geometridae:0.0559243036):0.0094027593,((((((Antheraea_mylitta:0.0549286716,Saturnia_pavonia:0.0389648962):0.0062731691,Actias_luna:0.6459117596):0.0081499624,Samia_ricini:0.0600540737)f_Saturniidae:0.0926576496,(Bombyx_mori:0.0716310271,Trilocha_varians:0.0831045547)f_Bombycidae:0.1200575117):0.0135771163,((((Lapara_coniferarum:0.0189111901,Sphinx_pinastri:0.0119829164):0.0167326938,Manduca_sexta:0.0276358987):0.0331964247,(Laothoe_populi:0.0525143667,(Mimas_tiliae:0.0308375282,Amorpha_juglandis:0.0299489192):0.0164070372):0.0133817805):0.0188806307,\
((Hyles_lineata:0.0172851596,Deilephila_elpenor:0.0229031276):0.0354193581,(Hemaris_fuciformis:0.0188235167,Cephonodes_hylas:0.0172746362):0.0344447569):0.0240531494)f_Sphingidae:0.0697886066):0.024633797,Dendrolimus_pini:0.1567805414):0.0163622841):0.0072773406,((((Polyploca_ridens:0.0144334555,Achlya_flavicornis:0.0105587117):0.0262428994,(Tetheella_fluctuosa:0.0344977417,Ochropacha_duplaris:0.0427108686):0.0046770934):0.0137465701,(Habrosyne_pyritoides:0.0580572897,Thyatira_batis:0.0570417844):0.013783746):0.0664122589,((Drepana_falcataria:0.071927519,Falcaria_lacertinaria:0.0629741676):0.0123123057,Watsonalla_binaria:0.0674338723):0.0743752365)f_Drepanidae:0.0365401633):0.0203821202,(((((Pyralis_farinalis:0.0622040532,Hypsopygia_costalis:0.0522228457):0.0363087082,Endotricha_flammealis:0.0992782972):0.0362725203,\
((Elegia_similella:0.0501952683,Acrobasis_suavella:0.0585239352):0.0125987617,(((Ephestia_elutella:0.0394681753,Plodia_interpunctella:0.047002999):0.0155559513,Cactoblastis_cactorum:0.07816117):0.0186801617,((Euzophera_pinguis:0.0411799508,Apomyelois_bistriatella:0.0311211537):0.029038276,Amyelois_transitella:0.0705921375):0.0052142192):0.0155879002):0.0616205743):0.0242414763,Galleria_mellonella:0.1102679799)f_Pyralidae:0.0321339743,\
((((((((Crambus_lathoniellus:0.0374201594,Chrysoteuchia_culmella:0.0408761634):0.0163407434,Agriphila_straminella:0.0462388495):0.0193239538,Calamotropha_paludella:0.0719385377):0.0149118219,Diatraea_saccharalis:0.0890271262):0.0251682936,Eudonia_lacustrata:0.0894025781):0.0242645572,((Nymphula_nitidulata:0.0435071732,Acentria_ephemerella:0.0504460431):0.0441115011,Parapoynx_stratiotata:0.0985366226):0.0397427395):0.0173292251,Heortia_vitessoides:0.1344771876):0.0145720734,(((Leucinodes_orbonalis:0.1023118481,Udea_ferrugalis:0.0851203553):0.0162320884,((Marasmia_exigua:0.0254415205,Cnaphalocrocis_medinalis:0.019584351):0.0451251365,(Mecyna_flavalis:0.0645120335,Cydalima_perspectalis:0.0662112793):0.0081702809):0.0182114082):0.0200558695,\
((Anania_fuscalis:0.0487393755,Pyrausta_nigrata:0.0504182962):0.0131406712,Ostrinia_furnacalis:0.06257373):0.040264477):0.0261096355)f_Crambidae:0.039654737):0.018643073):0.0109663893,(((Coleophora_flavipennella:0.1504749809,Blastobasis_lacticolella:0.178509728):0.0213829019,(Esperia_sulphurella:0.1038736244,Hofmannophila_pseudospretella:0.0942111435)f_Oecophoridae:0.0188185792):0.0185146253,(((((((Tuta_absoluta:0.0311815746,Phthorimaea_operculella:0.0224176441):0.0289466306,Scrobipalpa_costella:0.0474204542):0.0340385667,(Carpatolechia_fugitivella:0.0468184541,Teleiodes_luculella:0.0642753506):0.0402416119):0.0220872836,Athrips_mouffetella:0.0901130472):0.0489338343,(Aproaerema_taeniolella:0.1269137111,Anarsia_innoxiella:0.1211577907):0.0182707694)\
f_Gelechiidae:0.0311749478,Hyposmocoma_kahamanoa:0.1570701899):0.0184710833,(Agonopterix_arenella:0.1190709115,Carcina_quercana:0.1549056465)f_Depressariidae:0.0165178938):0.0082281768):0.025460521):0.0061458976,((((Stenoptilia_bipunctidactyla:0.0875952729,Marasmarcha_lunaedactyla:0.097960167):0.0877022714,Emmelina_monodactyla:0.1630961069)f_Pterophoridae:0.0747861706,Carposina_sasakii:0.2130290171):0.0262235317,((((((Calephelis_nemesis:0.0339813049,Lasaia_sula_peninsularis:0.0345577554)f_Riodinidae:0.1090632395,((((Glaucopsyche_alexis:0.0288589734,Celastrina_argiolus:0.0449054907):0.0069154703,\
(((((Lysandra_coridon:0.0099800366,Polyommatus_icarus:0.0115939634):0.0025575169,Aricia_agestis:0.0117911793):0.0011713837,Cyaniris_semiargus:0.0105710473):0.0025637272,Plebejus_argus:0.0130847111):0.0081746955,Cyclargus_thomasi:0.0330000561):0.0185586502):0.058351939,Eumaeus_atala:0.0997987541):0.0160172146,Lycaena_phlaeas:0.0661445703)f_Lycaenidae:0.0746073347):0.0388226067,((((((((Oeneis_ivallda:0.0219456984,Hipparchia_semele:0.0207013435):0.0195764669,Melanargia_galathea:0.0440019766):0.0087647849,(Erebia_aethiops:0.0413805958,Maniola_hyperantus:0.0461621805):0.0103041479):0.0134757809,((Pararge_aegeria_aegeria:0.0481600699,Lasiommata_megera:0.0504541182):0.0201852667,Bicyclus_anynana:0.074393816):0.0159658669):0.0265546322,Elymnias_hypermnestra:0.1024757549):0.0125277594,Morpho_deidamia:0.098614549):0.043785149,\
(((((Euphydryas_editha:0.0315327096,(Mellicta_athalia:0.0133493402,Melitaea_cinxia:0.0285704921):0.0299731682):0.0287222824,(Hypolimnas_misippus:0.0287804299,Junonia_neildi_ssp._1_JZ-2019:0.0332400309):0.0158573177):0.0132218429,(Vanessa_cardui:0.0263350631,Nymphalis_io:0.0298649221):0.0377008475):0.0206779759,Hestina_assimilis:0.0821258072):0.029791232,((((Laparus_doris_viridis:0.0305340696,Heliconius_nattereri:0.0185204212):0.0262079154,Dione_vanillae_vanillae:0.0424779201):0.0488083797,((Fabriciana_adippe:0.0130274249,Brenthis_hecate:0.0163845438):0.011714873,Boloria_selene:0.0458608647):0.0345488031):0.0285523227,(Limenitis_camilla:0.0291902183,Neptis_clinioides:0.0325530109):0.0693743223):0.0271945584):0.0184873619):0.0103809557,\
((Melinaea_menophilus_n._ssp._AW-2005:0.0391757409,Ithomia_salapia_aquinia:0.0467861036):0.04115738,Danaus_chrysippus:0.0853145533):0.0777200481)f_Nymphalidae:0.0251005184):0.0179821639,(Leptidea_sinapis:0.1793577422,(((Anthocharis_cardamines:0.0654764668,Hebomoia_glaucippe:0.0826291387):0.0102847946,(Pieris_mannii:0.072330049,(Delias_oraia:0.0736346701,Aporia_crataegi:0.0416933529):0.0325124978):0.0455565639):0.0362186042,(((Colias_croceus:0.0282470401,Zerene_cesonia:0.0271263657):0.0298791279,Phoebis_sennae:0.048001766):0.021137859,Eurema_hecabe:0.0907976287):0.0257817279):0.0374442866)f_Pieridae:0.0628156345):0.0220943205,((((((Pyrgus_malvae:0.0637562987,(Tiana_niger:0.0476657502,Noctuana_stator:0.0490955115):0.028679862):0.0064738019,(Erynnis_tages:0.065385794,Clito_sp._Burns02:0.0682819073):0.015194239):0.0196241773,\
((((Croniades_pieria_auraria:0.023713024,Parelbella_ahira_ahira:0.0232497936):0.002966668,Microceris_scylla:0.022635749):0.0160688874,((Mimoniades_nurscia_nurscia:0.0236112159,Jemadia_suekentonmiller:0.027402507):0.0030668978,Mysoria_ambigua:0.0363094552):0.0213656921):0.0191149296,((Passova_gellias:0.0218187931,Agara_michaeli:0.0170542855):0.0105871999,(Aspitha_aspitha_aspitha:0.0306367298,Myscelus_amystis_hages:0.0273863547):0.0089076427):0.0361257856):0.0443552068):0.0109124414,((((((Urbanus_simplicius:0.0229331428,Cecropterus_lyciades:0.0260163529):0.0077031854,Astraptes_apastus:0.0326216368):0.0066193487,Epargyreus_clarus_clarus:0.0344354712):0.0185104557,Polygonus_leo:0.0578814973):0.0055563843,(Phareas_burnsi:0.038350411,Phocides_pigmalion_okeechobee:0.0501421623):0.0092583762):0.0134016575,Udranomia_eurus:0.0906175931):0.0165888507):0.0069434436,\
((((((Thymelicus_acteon:0.0256297887,Copaeodes_aurantiaca:0.0427609326):0.0160166996,(Calpodes_ethlius:0.0277256834,Panoquina_ocola_ocola:0.0440494868):0.0124270563):0.006795787,(Hesperia_comma:0.0331452923,Ochlodes_sylvanus:0.0292490191):0.0211924324):0.0031948552,((Asbolis_capucinus:0.0488512097,Lerema_accius:0.0453499689):0.0061744475,Carystus_phorcus:0.0411028636):0.0034993667):0.0101954388,((Megathymus_violae:0.0203710984,Agathymus_mariae_mariae:0.0219873059):0.0335209148,Perichares_adela:0.057962453):0.0071114252):0.0412743569,(Carterocephalus_palaemon:0.0628139074,Dalla_quadristriga:0.0535772579):0.0387276292):0.0150441855):0.0383621233,Choaspes_benjaminii:0.1260674176)f_Hesperiidae:0.06020044):0.0168866953,((Luehdorfia_chinensis:0.0509084206,Bhutanitis_thaidina:0.0695099186):0.022324894,\
((Lamproptera_curius:0.0833298203,Mimoides_lysithous_rurik:0.0786931501):0.0406422602,(Teinopalpus_imperialis:0.0897576105,((Battus_philenor:0.0762523818,(((Parides_photinus:0.0613018325,(Troides_oblongomaculatus:0.0190327368,Ornithoptera_alexandrae:0.0201920839):0.0206428849):0.0068622022,(Pachliopta_kotzebuea:0.0450542651,Byasa_hedistus:0.0379142709):0.0076815669):0.0211212727,Pharmacophagus_antenor:0.0714037658):0.028233976):0.0234089733,(Meandrusa_payeni:0.0844816173,Papilio_machaon:0.0885407949):0.0203630426):0.0100976872):0.0103589402):0.0108089425)f_Papilionidae:0.0822051642):0.0279048336):0.0108493946):0.0096747248,((Apoda_limacodes:0.1558750685,Zygaena_filipendulae:0.2094480683):0.0330749142,(Zeuzera_pyrina:0.156504838,(Sesia_apiformis:0.0956380012,\
(Bembecia_ichneumoniformis:0.0307575259,Synanthedon_tipuliformis:0.0398424379):0.1319999573)f_Sesiidae:0.0658455608):0.0118905932):0.0083782405):0.0130054085,((((Thaumatotibia_leucotreta:0.0425971878,(((Pammene_aurita:0.0367573367,Grapholita_molesta:0.0424360634):0.0069782216,Lathronympha_strigana:0.0420609403):0.0036244641,(Leguminivora_glycinivorella:0.0311019453,Cydia_amplana:0.0255807483):0.0126103084):0.0068299759):0.0171043126,(Notocelia_uddmanniana:0.0362194864,Epinotia_demarniana:0.0478948907):0.0173165718):0.0156334778,((Apotomis_capreana:0.0404646973,Hedya_salicella:0.0423049614):0.0138894125,Eudemis_profundana:0.0418401013):0.0127616099):0.0394096327,((((Archips_xylosteana:0.0259194324,Choristoneura_fumiferana:0.0271515306):0.0134811591,Pandemis_corylana:0.0382811072):0.0097055438,Adoxophyes_honmai:0.0482503268):0.0433019785,\
(Acleris_cristana:0.0895014414,Tortricodes_alternella:0.0616578934):0.0236632986):0.018165084)f_Tortricidae:0.1096963843):0.0324234312,((Argyresthia_goedartella:0.1952297844,(Ypsolopha_scabrella:0.119890734,(Yponomeuta_cagnagella:0.0710436341,Zelleria_hepariella:0.0638182091)f_Yponomeutidae:0.0964398481):0.0180948671):0.0253825113,Conopomorpha_cramerella:0.242214229):0.0264565957):0.0413363915,(Eumeta_japonica:0.1498196666,Luffia_ferchaultella:0.1130532879)f_Psychidae:0.1181619581):0.0250289012,(Monopis_laevigella:0.2333288527,(Tinea_pellionella:0.0550761668,Tineola_bisselliella:0.0674439959):0.1676765449)f_Tineidae:0.1012408958):0.1099003107,(Nematopogon_swammerdamellus:0.1399504193,Incurvaria_masculella:0.1556619015):0.140966009):0.2090448939,(Micropterix_aruncella:0.2136789797,Neomicropteryx_cornuta:0.1922607605)f_Micropterigidae:0.2574379156)o_Lepidoptera:0.0864634912,\
((((((((((Limnephilus_rhombicus:0.009580319,Glyphotaelius_pellucidus:0.0084083408):0.0096516976,Hesperophylax_magnus:0.0169790212):0.0084066792,Halesus_radiatus:0.0350946121):0.0076874133,Drusus_annulatus:0.0266053431)f_Limnephilidae:0.1175398052,(Lepidostoma_basale:0.1591953749,Micrasema_longulum:0.1371053829):0.0259580034):0.0206775834,(Agrypnia_vestita:0.0305683265,Eubasilissa_regina:0.0292022539)f_Phryganeidae:0.0732501346):0.0721214198,(Odontocerum_albicorne:0.1499972344,Athripsodes_cinereus:0.2863944722):0.0529400646):0.074344905,((Rhyacophila_brunnea:0.0711136895,Himalopsyche_kuldschensis:0.0796889853)f_Rhyacophilidae:0.1648254635,(Glossosoma_conforme:0.2505945511,Atopsyche_davidsoni:0.2021981852):0.0244049713):0.0238796571):0.0522337497,((((Arctopsyche_grandis:0.0888276931,Parapsyche_elsis:0.0817598691):0.0895592477,Leptonema_lineaticorne:0.2307425537):0.0259865081,\
(Hydropsyche_tenuis:0.1071474913,Cheumatopsyche_charites:0.1241597793):0.1040113888)f_Hydropsychidae:0.1074552928,((Stenopsyche_tienmushanensis:0.200675391,Philopotamus_ludificatus:0.2693825623):0.0447299386,Plectrocnemia_conspersa:0.3283149098):0.0454953478):0.1277679964):0.0344595427,Agraylea_sexmaculata:0.4322703611)o_Trichoptera:0.1305624615):0.2210700022,(((((((((((((((((Eurosta_solidaginis:0.074541277,(Merzomyia_westermanni:0.0272805988,Sphenella_marginata:0.0290123981):0.0315420786):0.0529278839,((Rhagoletis_zephyria:0.1282232329,Anastrepha_obliqua:0.0660422281):0.0118839151,((Neoceratitis_asiatica:0.0408787227,Ceratitis_capitata:0.0368617839):0.0490938915,(Zeugodacus_cucurbitae:0.0308880561,Bactrocera_minax:0.0544203501):0.038560298):0.0214227624):0.0172517034)f_Tephritidae:0.1553228639,(Teleopsis_dalmanni:0.2636892213,Chlorops_oryzae:0.301132955):0.0291081749):0.0154202917,\
(((((Delia_radicum:0.0414102757,(Leucophora_obtusa:0.0451435856,Eustalomyia_histrio:0.0563707542):0.0062678674)f_Anthomyiidae:0.0462508559,((((Pollenia_amentaria:0.0758640496,((((Cistogaster_globosa:0.0261519767,Gymnosoma_rotundatum:0.0247066904):0.0495800385,Phasia_obesa:0.0556015264):0.0190784734,Thelaira_solivaga:0.1258021708):0.0052370497,(((Tachina_fera:0.0229163251,Nowickia_ferox:0.0192602504):0.062517022,Lypha_dubia:0.089834311):0.0154949401,(Thecocarcelia_acutangulata:0.0522365119,Epicampocera_succincta:0.0611950551):0.0593849516):0.0085135858)f_Tachinidae:0.0152842587):0.0119169038,((Stomorhina_lunata:0.0742347293,((Calliphora_vomitoria:0.0218185479,Bellardia_bayeri:0.0384278823):0.0194499697,Lucilia_cuprina:0.0383810215):0.0086466439):0.0047788944,(Phyto_melanocephala:0.0712103531,Paykullia_maculata:0.0655117766)f_Rhinophoridae:0.0306324063):0.0029963381):0.0046137724,\
((Protocalliphora_azurea:0.0285960904,(Protophormia_terraenovae:0.008503513,Phormia_regina:0.0152948759):0.0040956791):0.0083554136,(Cochliomyia_hominivorax:0.0449856717,Chrysomya_rufifacies:0.0449418533):0.0089550549):0.0195339007):0.0166879196,(Wohlfahrtia_magnifica:0.0548546911,Sarcophaga_rosellei:0.0589137256)f_Sarcophagidae:0.0311418061):0.0254823888):0.0344754623,((Polietes_domitor:0.0658953556,(Stomoxys_calcitrans:0.0793041686,Musca_domestica:0.0803612551):0.0217238274):0.0314332875,Philornis_downsi:0.1048499269)f_Muscidae:0.0360116159):0.0554479251,(Glossina_fuscipes:0.1826340613,Melophagus_ovinus:0.3009266269):0.0672231158):0.0975287683,(Ephydra_gracilis:0.2523834702,((((Lordiphosa_clarofinis:0.1020174248,Drosophila_serrata:0.1296315313):0.0303630318,((Scaptomyza_montana:0.0931829531,Hirtodrosophila_cameraria:0.0806806361):0.0184512784,Zaprionus_capensis:0.0930516363):0.048112473):0.0357714434,\
(Chymomyza_costata:0.1280931012,Scaptodrosophila_lebanonensis:0.121589819):0.0187384335):0.1320443811,(Leucophenga_varia:0.1374728979,Phortica_variegata:0.1335449422):0.0498727094)f_Drosophilidae:0.0944126688):0.0274548102):0.0176955547):0.01677909,(Clusia_tigrina:0.2160451475,(Heteromyza_rotundicornis:0.1272227311,Suillia_variegata:0.1577443916)f_Heleomyzidae:0.0216845386):0.0150959901):0.0519876089,((((Coremacera_marginata:0.0478267677,Pherbina_coryleti:0.0425107539)f_Sciomyzidae:0.0873986393,(((Thecophora_atra:0.135859883,Myopa_tessellatipennis:0.0857940671):0.0599413698,Conops_quadrifasciatus:0.1678164819):0.0158747947,Sicus_ferrugineus:0.1677796985)f_Conopidae:0.0463457514):0.0417025667,Tricholauxania_praeusta:0.1471922134):0.0138002126,Coelopa_pilipes:0.1326891549):0.0496789866):0.0993946264,Nephrocerus_scutellatus:0.1789326699):0.0586515015,(Volucella_bombylans:0.1128234072,\
(((((Portevinia_maculata:0.0935984813,Cheilosia_vernalis:0.0642877287):0.0104927661,Rhingia_rostrata:0.0938834575):0.0261296006,((((Brachypalpus_laphriformis:0.0463517406,Chalcosyrphus_nemorum:0.0597440447):0.0107551069,Xylota_sylvarum:0.0507862447):0.0104771363,Blera_fallax:0.0471329423):0.0156003352,(Brachyopa_scutellaris:0.0828338413,Criorhina_berberina:0.0704423502):0.0085454097):0.0063159321):0.0063514614,(((((((Melangyna_quadrimaculata:0.0460432914,(Chrysotoxum_bicinctum:0.0412575773,Dasysyrphus_albostriatus:0.0358430057):0.0050861822):0.0026427265,(Leucozona_laternaria:0.0306641709,(Epistrophella_euchroma:0.0296048849,Epistrophe_eligans:0.0298085502):0.0039291101):0.008077722):0.0035304319,(Xanthogramma_pedissequum:0.0704148959,(Eupeodes_corollae:0.0328121028,Scaeva_pyrastri:0.0417532006):0.0227065619):0.0041029311):0.013915707,(Sphaerophoria_taeniata:0.0922711238,\
(Episyrphus_balteatus:0.0327295164,Meliscaeva_auricollis:0.0329516319):0.0112895475):0.0132114521):0.0266209709,(Platycheirus_albimanus:0.0589777659,Baccha_elongata:0.0765165004):0.0095451876):0.0300597005,Melanostoma_scalare:0.0834945188):0.0505938753,Neoascia_interrupta:0.1038027523):0.011197883):0.0092031541,(((Myathropa_florea:0.0355616697,Eristalis_arbustorum:0.0498709242):0.0122354386,Eristalinus_sepulchralis:0.0522696118):0.0737927882,Syritta_pipiens:0.097070137):0.0232317495):0.0183554539)f_Syrphidae:0.1222627038):0.1585564928,((Poecilobothrus_nobilitatus:0.1270631966,Condylostylus_longicornis:0.130706457)f_Dolichopodidae:0.2243511972,Empis_stercorea:0.2387264693):0.0837211614):0.0476175788,(Thereva_unica:0.2208492393,((Holcocephala_fusca:0.217447723,Dasypogon_diadema:0.1140400705):0.0349414191,\
(((Dysmachus_trigonus:0.0452392784,Machimus_rusticus:0.0472394083):0.0280747849,Neoitamus_cyanurus:0.0758947641):0.0345045279,Proctacanthus_coquilletti:0.0875130257):0.0981631665)f_Asilidae:0.0699618008):0.0397638361):0.0170916424,(Villa_cingulata:0.1802036188,Bombylius_major:0.1670611032)f_Bombyliidae:0.1440142056):0.0343091239,(((Hermetia_illucens:0.0907054814,Microchrysa_polita:0.147568558):0.0242362338,Nemotelus_nigrinus:0.1691779921):0.0791862198,Beris_chalybata:0.1546875064)f_Stratiomyidae:0.1177351018):0.0296140203,Acrocera_orbiculus:0.464391149):0.1493521747,(((((((Pseudolycoriella_hygida:0.1242134148,(Phytosciara_flavipes:0.06260397,Bradysia_coprophila:0.0424933197):0.0612535656):0.0525899485,Trichosia_splendens:0.1004283733)f_Sciaridae:0.1769411735,Diadocidia_ferruginosa:0.2597731687):0.0392046592,\
(Macrocera_vittata:0.3052260148,Bolitophila_cinerea:0.2490785438):0.027027406):0.0582930317,(Bibio_marci:0.3120455112,Penthetria_funebris:0.2507859216):0.0838179766):0.0251992913,(((Lestremia_cinerea:0.250676782,Catotricha_subobsoleta:0.1458637315):0.0480191676,((((Resseliella_maxima:0.1104180639,Contarinia_nasturtii:0.1067978078):0.0202740414,Sitodiplosis_mosellana:0.0825878953):0.0313034294,Obolodiplosis_robiniae:0.1175073135):0.0774840266,Mayetiola_destructor:0.223176409):0.2196579755)f_Cecidomyiidae:0.1421656973,Symmerus_nobilis:0.4328871269):0.027038873):0.0757859457,(Sylvicola_fuscatus:0.4263888901,Coboldia_fuscipes:0.5304629298):0.0519671452):0.0312653422):0.0424318527,((Nephrotoma_appendiculata:0.059933491,Tipula_unca:0.0574687649)f_Tipulidae:0.3981503931,
(Clogmia_albipunctata:0.4410452512,(Lutzomyia_longipalpis:0.1212399272,Phlebotomus_argentipes:0.1123293657):0.2748064654)f_Psychodidae:0.1267340091):0.0329331443):0.0378994435,(((((((Aedes_aegypti_aegypti:0.0431195088,Armigeres_subalbatus:0.0685959376):0.0683115,(Uranotaenia_lowii:0.1537399299,Culex_pipiens_pallens:0.1231484026):0.0193075075):0.0131419197,((Topomyia_yanbarensis:0.057965203,Malaya_genurostris:0.0846451528):0.0462771101,(Wyeomyia_smithii:0.0581513083,Sabethes_cyaneus:0.062985203):0.066724117):0.0398624602):0.0194236419,Toxorhynchites_rutilus_septentrionalis:0.1342596637):0.0769489286,Anopheles_albimanus:0.3117420946)f_Culicidae:0.1160208096,Mochlonyx_cinctipes:0.2443730328):0.1455469058,((Culicoides_sonorensis:0.2832339613,Forcipomyia_taiwana:0.3592669916)f_Ceratopogonidae:0.2547288508,(((Chironomus_tepperi:0.1805811416,Polypedilum_vanderplanki:0.1821737224):0.1568877579,\
(Belgica_antarctica:0.199677476,Clunio_marinus:0.1873038019):0.0636912431):0.0396192604,Propsilocerus_akamusi:0.1996057187)f_Chironomidae:0.369549507):0.0593607151):0.0624228537)o_Diptera:0.2693373695,Ctenocephalides_felis:0.5451191366):0.0874265347):0.0687319605):0.0871166675,(((((((((Belonocnema_kinseyi:0.0512424258,Neuroterus_valhalla:0.0482098798):0.0427739922,Synergus_umbraculus:0.0960406399)f_Cynipidae:0.0600629028,(Ganaspis_sp._Gsp50:0.12422177,Leptopilina_heterotoma:0.1440797863)f_Figitidae:0.0768068573):0.1790144149,(((((((((Gastracanthus_pulcherrimus:0.0797293202,((Philotrypesis_tridentata:0.0723176111,Apocrypta_bakeri:0.0836755437):0.0216262196,\
(((Pteromalus_puparum:0.0277615774,(Nasonia_longicornis:0.009341989,Trichomalopsis_sarcophagae:0.0098787298):0.0231794525):0.0189902699,Muscidifurax_raptorellus:0.048657406):0.0043080835,Cecidostiba_semifascia:0.0358120041):0.0192796146):0.0633779562):0.0331025618,Megastigmus_dorsalis:0.142884327):0.0127975279,(((Theocolax_elegans:0.1755623428,Sycophaga_agraensis:0.2140907667):0.0209767349,(((Wiebesia_pumilae:0.0943805347,Dolichoris_vasculosae:0.1286929434):0.0117708654,(Eupristina_koningsbergeri:0.1563738296,Platyscapa_corneri:0.094376962):0.0290278584):0.026446297,(Ceratosolen_solmsi_marchali:0.1370110122,Kradibia_gibbosae:0.1504700671):0.0375183547):0.1057705856)f_Agaonidae_-1:0.0120947936,((Sycobia_sp._Sy_11:0.2044999063,Ormyrus_pomaceus:0.161315958):0.0302500084,(Chalcis_sispes:0.1467771551,(Eurytoma_adleriae:0.048308116,Sycophila_sp._Sp_5:0.0758683757)\
f_Eurytomidae:0.1115092534):0.0211611882):0.0082010416):0.0089058583):0.010889059,(Anastatus_disparis:0.1384032752,Eupelmus_annulatus:0.1051893857)f_Eupelmidae:0.0427007049):0.0107821325,((Phymastichus_coffea:0.0930499969,Chouioia_cunea:0.0980370913)f_Eulophidae:0.1520052675,Torymus_auratus:0.1600447168):0.0200691637):0.0144447391,(Copidosoma_floridanum:0.2896925019,Aphelinus_atriplicis:0.1796933472):0.0252886801):0.0277134555,Trichogramma_pretiosum:0.3958602916):0.0665220678,Anagrus_nilaparvatae:0.35571014):0.1316546875,(((Platygaster_robiniae:0.3056562484,Zelostemma_sp._ZL-2020:0.1350842403):0.1151748864,Nixonia_krombeini:0.1820693918):0.0408540157,(((((Psilanteris_sp._ZL-2020:0.1951897404,Ceratoteleas_bidentatus:0.1827771429):0.0185511063,Idris_sp._1_HC-2018:0.1923441355):0.0123907253,(Gryon_sp._ZL-2020:0.167084242,(Psix_sp._ZL-2020:0.1543202169,\
(Trissolcus_basalis:0.0665905031,Telenomus_remus:0.0811119276):0.1301017248):0.0223966408):0.028637469):0.0147033957,(Leptoteleia_sp._ZL-2020:0.1952312191,Aradophagus_sp._ZL-2020:0.1692275501):0.0192069351):0.0860104683,Probaryconus_sp._ZL-2020:0.2560319229):0.1158787316)f_Scelionidae_-1:0.124038773):0.0279794422):0.0478000982,(((Gonatopus_flavifemur:0.2679841651,(Prorops_nasuta:0.2732974482,Goniozus_legneri:0.2628061099)f_Bethylidae:0.0665409159):0.0221728015,(((Anoplius_nigerrimus:0.268891748,Tiphia_femorata:0.2084522459):0.0425448537,(((((((((((((Eufriesea_mexicana:0.0345627459,Euglossa_dilemma:0.0469265515):0.0816842644,(((((Lepidotrigona_ventralis_hoosana:0.011154663,Heterotrigona_itama:0.0095680143):0.0071019635,Tetragonula_carbonaria:0.0208948505):0.0134619587,\
(Frieseomelitta_varia:0.0181139381,Melipona_quadrifasciata:0.0273940275):0.0070517705):0.0575769962,Bombus_vancouverensis_nearcticus:0.0700036277):0.0267879881,Apis_cerana_cerana:0.0951412384):0.0113074314):0.0241714499,(Ctenoplectra_terminalis:0.0952594957,(Eucera_pruinosa:0.1102318514,Ceratina_calcarata:0.1481411098):0.0161840446):0.0097771282):0.0118315288,Habropoda_laboriosa:0.1253179865):0.0083143593,(Nomada_fucata:0.0975949554,Holcopasites_calliopsidis:0.0861100965):0.043847554)f_Apidae:0.0267322543,(((Coelioxys_conoideus:0.055231029,Megachile_ligniseca:0.0469284123):0.0457165493,Osmia_lignaria:0.0764172498):0.0119441046,(Stelis_phaeoptera:0.0527103791,Anthidium_xuezhongi:0.0678405794):0.0296041635)f_Megachilidae:0.0610558044):0.0301090056,((((((((Lasioglossum_morio:0.0452886036,(Seladonia_tumulorum:0.0174197917,Halictus_rubicundus:0.0138842902):0.0192798227):0.0120984039,\
Sphecodes_monilicornis:0.0387958217):0.00943228,Agapostemon_virescens:0.0945194448):0.033585057,(Megalopta_genalis:0.0435235204,(Augochlorella_aurata:0.0283231239,Augochlora_pura:0.0501415956):0.0137161783):0.0567345664):0.0438165103,Nomia_melanderi:0.1128852926):0.0324897233,Dufourea_novaeangliae:0.1110126233)f_Halictidae:0.0334158213,Colletes_collaris:0.1449803546):0.0144981475,Andrena_dorsata:0.1321959609):0.0149518424):0.0118283861,Macropis_europaea:0.1281994253):0.0469053826,Cerceris_rybyensis:0.1730499623):0.0120607596,(Pemphredon_lugubris:0.1605676834,Mimumesa_dahlbomi:0.149376041):0.0198876164):0.0280019325,(Nysson_spinosus:0.1758584243,Ectemnius_continuus:0.2734503038):0.0250738435):0.0287174059,Ampulex_compressa:0.208347475):0.0276227574,((((((Aphaenogaster_rudis:0.0532979341,(((Solenopsis_invicta:0.0537559053,Monomorium_pharaonis:0.0635488644):0.0251139974,\
(Wasmannia_auropunctata:0.0671410253,(Cyphomyrmex_costatus:0.0533901384,(((Acromyrmex_echinatior:0.0096268216,Pseudoatta_argentina:0.0133125853):0.0103708206,Atta_colombica:0.019836115):0.0146176572,Trachymyrmex_zeteki:0.0318603705):0.0109661921):0.0370854288):0.009950075):0.0040604193,((Crematogaster_levior:0.064364314,(Vollenhovia_emeryi:0.0848897825,Temnothorax_longispinosus:0.0526733013):0.008318028):0.0038256739,(Tetramorium_alpestre:0.0603800125,Cardiocondyla_obscurior:0.1028672731):0.0104365005):0.0089970213):0.006408021):0.0167195607,Pogonomyrmex_californicus:0.0818595992):0.0380811247,((Nylanderia_fulva:0.0671127715,Lasius_fuliginosus:0.0362577319):0.0146777824,((Camponotus_vicinus:0.0569251926,\
(Formica_selysi:0.025847383,Cataglyphis_hispanica:0.0301679778):0.0225303648):0.0045484409,Anoplolepis_gracilipes:0.0560594553):0.0081453876):0.050679172):0.0125567355,(Pseudomyrmex_gracilis:0.1671471262,Linepithema_humile:0.1067183972):0.0117796785):0.0136678835,(Ooceraea_biroi:0.0854815729,Eciton_burchellii:0.1179975487):0.0699526694):0.0302024509,((Odontomachus_brunneus:0.0733634138,Harpegnathos_saltator:0.0811644299):0.0114826187,Dinoponera_quadriceps:0.0810921998):0.0829228822)f_Formicidae:0.1294516145):0.017862023):0.0127883187,(Liostenogaster_flavolineata:0.2188333581,(Ancistrocerus_nigricornis:0.09806329,(((Vespa_crabro:0.0290343637,Dolichovespula_saxonica:0.0368860811):0.0094574137,Vespula_pensylvanica:0.0316862267):0.0288390327,(Mischocyttarus_mexicanus:0.0704462414,Polistes_dominula:0.0556496925):0.0693915394):0.0549940019):0.0975102233)\
f_Vespidae:0.0537399314):0.0292038041):0.0497501276,Gasteruption_jaculator:0.2969455534):0.0241977576):0.0147360942,((((Alloplasta_piceator:0.139445545,(Ophion_costatus:0.1317537956,(Venturia_canescens:0.0675921492,Campoletis_raptor:0.0538084072):0.0678679287):0.0544701226):0.016230531,Netelia_dilatata:0.1246042277):0.0295663576,((Tromatobia_lineatoria:0.0381437079,Clistopyga_incitator:0.0336811783):0.0855548168,((Ichneumon_xanthorius:0.0172306827,Amblyteles_armatorius:0.0131454671):0.0649202072,Buathra_laborator:0.0812241357):0.0475497169):0.0181339791)f_Ichneumonidae:0.1097908458,((((Galerucella_tenella:0.316334242,(Microctonus_brassicae:0.1207470136,Meteorus_sp._PSUC_FEM_10030008:0.1397411943):0.0261910397):0.0745110466,(Macrocentrus_cingulum:0.242736667,Eumacrocentrus_americanus:0.0970275987):0.0553534896):0.0218778602,((Cotesia_glomerata:0.1182375647,Microplitis_demolitor:0.0785520281):0.1503318603,Chelonus_insularis:0.2343480494):0.0585375671):0.0380645655,\
(((Asobara_japonica:0.1427974856,Fopius_arisanus:0.1097694756):0.0648014024,Aleiodes_sp._PSUC_FEM_10030003:0.1354359868):0.077819355,(Aphidius_gifuensis:0.0544139358,Lysiphlebus_fabarum:0.0739043185):0.2921121177):0.0377881745)f_Braconidae_-7:0.0915711269):0.0742866898):0.0232903349,Orussus_abietinus:0.29624726):0.0207916716,(Pachycephus_smyrnensis:0.0209506532,((((Cephus_cinctus:0.0199368282,Trachelus_troglodyta:0.0181311663):0.0051964344,Calameuta_filiformis:0.0206566761):0.020765122,Syrista_parreyssii:0.0342370586):0.0138364989,Phylloecus_linearis:0.0483223028):0.0066093012)f_Cephidae:0.1735418898):0.0683462247,(((Diprion_similis:0.0403779703,Neodiprion_virginianus:0.0318966953)f_Diprionidae:0.1018479226,(((Tenthredo_notha:0.0328564792,Rhogogaster_chlorosoma:0.0366515337):0.0212624262,Macrophya_alboannulata:0.043919304):0.0417302566,Euura_saliciscinereae:0.1072010227)f_Tenthredinidae:0.0289583585):0.0251553361,Athalia_rosae:0.13246826):0.1348313867)o_Hymenoptera_-36:0.3181508315):0.0784012013,\
((((((Philaenus_spumarius:0.1169021847,Callitettix_versicolor:0.1156980807):0.2039722282,((Homalodisca_vitripennis:0.1733792586,(Macrosteles_quadrilineatus:0.0967652657,Nephotettix_cincticeps:0.1031888739):0.1013233636):0.0299067104,Matsumurasca_onukii:0.2410011728)f_Cicadellidae:0.2010141307):0.0947287379,((Nilaparvata_lugens:0.0922417014,(Sogatella_furcifera:0.0546010342,Laodelphax_striatellus:0.042802098):0.0211545811):0.02128266,Conomelus_anceps:0.0594312426)f_Delphacidae:0.4728785285):0.0575161654,(((((Euschistus_heros:0.0566776476,(((Nezara_viridula:0.0453380801,Aelia_acuminata:0.0571027354):0.0112931583,(Rhaphigaster_nebulosa:0.0310813238,Stiretrus_anchorago:0.0698701698):0.0079015203):0.0053136309,Halyomorpha_halys:0.0472680776):0.0165398513)f_Pentatomidae:0.0769331698,Acanthosoma_haemorrhoidale:0.1493881686):0.120995751,((Gonocerus_acuteangulatus:0.1081843106,Riptortus_pedestris:0.1125725796):0.0722549777,Oncopeltus_fasciatus:0.2606013565):0.0619429552):0.2264779565,\
(((((Apolygus_lucorum:0.0525899276,Lygus_lineolaris:0.0549155382):0.0964424386,Cyrtorhinus_lividipennis:0.2023701168):0.0282074274,(Pachypeltis_micranthus:0.2276932109,Nesidiocoris_tenuis:0.2556128398):0.0222549136)f_Miridae:0.2869902108,(Cimex_lectularius:0.2002843749,Orius_insidiosus:0.2466519629):0.2164778886):0.0581795728,(Triatoma_infestans:0.064978726,Rhodnius_prolixus:0.0792228902)f_Reduviidae:0.2923749472):0.0617669621):0.0967101476,(((Gerris_lacustris:0.1435295597,Microvelia_longipes:0.175049804):0.2284674617,Hermatobates_lingyangjiaoensis:0.4334527523):0.2383894206,Lethocerus_indicus:0.3593179036):0.0402284452):0.218427398):0.0562123631,((((Icerya_purchasi:0.6793496635,(Ericerus_pela:0.388974397,((((Planococcus_citri:0.0888211832,(Ferrisia_virgata:0.0918907255,Pseudococcus_longispinus:0.0765789846):0.0118363879):0.0095892052,((Hypogeococcus_pungens:0.0538681826,Paracoccus_marginatus:0.0368044526):0.0400050453,\
Trionymus_perrisii:0.0636667188):0.033789231):0.0573799222,Maconellicoccus_hirsutus:0.1345268934):0.0865946054,Phenacoccus_solenopsis:0.1605314246)f_Pseudococcidae:0.1574163539):0.2372764922):0.2173997367,(((((Pemphigus_obesinymphae:0.0779592435,(Schlechtendalia_chinensis:0.0719384643,Geopemphigus_sp._TES_GeoC_2020:0.0888445693):0.0494428917):0.0197038465,(Cinara_cedri:0.1328453164,(Tetraneura_akinire:0.0893183703,Eriosoma_lanigerum:0.0651891544):0.0486604012):0.0108936817):0.0055578561,((Stegophylla_sp._TES_Ste_2020:0.0807154682,Therioaphis_trifolii:0.0634457402):0.0508462534,(((((((Macrosiphum_rosae:0.0136260453,Acyrthosiphon_pisum:0.011618748):0.0012456751,(Metopolophium_dirhodum:0.0071154286,Sitobion_avenae:0.0102292631):0.0041192861):0.0095374624,Nasonovia_ribisnigri:0.0209293684):0.0049524244,(Diuraphis_noxia:0.0384991328,(Myzus_persicae:0.0147059537,Aulacorthum_solani:0.0270182588):0.0081123236):0.0035195726):0.0075085459,\
(Pentalonia_nigronervosa:0.0240251082,Neotoxoptera_formosana:0.0172854332):0.0180107074):0.0100173067,(((Schizaphis_graminum:0.0113722219,Rhopalosiphum_maidis:0.0084354945):0.0148563882,Aphis_gossypii:0.0306096891):0.0032370635,Melanaphis_sacchari:0.0306754127):0.015364226):0.0630839701,(((Chaitophorus_viminalis:0.050786366,Periphyllus_acericola:0.0409445356):0.0070141209,Sipha_flava:0.0531388318):0.038381946,Drepanosiphum_platanoidis:0.0899944691):0.0278080558):0.0065154005):0.0071206991)f_Aphididae_-1:0.0177995186,Hormaphis_cornu:0.1449880094):0.0715135665,(Daktulosphaira_vitifoliae:0.1443150249,Adelges_cooleyi:0.1159659432):0.0578320101):0.7363058282):0.0981438139,((Bactericera_cockerelli:0.1631764042,Diaphorina_citri:0.1426911066):0.1079281205,Pachypsylla_venusta:0.2151567233):0.5831020479):0.0461433096,(Trialeurodes_vaporariorum:0.1659337308,Bemisia_tabaci:0.1731726432)f_Aleyrodidae:0.50423003):0.0836940375)o_Hemiptera:0.0996290688,\
((((Frankliniella_occidentalis:0.1310509831,Megalurothrips_usitatus:0.1515978039):0.0219898203,Thrips_palmi:0.1479956709):0.0407016573,Aptinothrips_rufus:0.1175420053)o_Thysanoptera:0.4989309846,(((((Columbicola_columbae:0.1913302054,Brueelia_nebulosa:0.2113645188)f_Philopteridae:0.0814337685,Pediculus_humanus_capitis:0.5115500063):0.0843526087,Ricinus_arcuatus:0.3662072022)o_Phthiraptera:0.0443554666,Liposcelis_brunnea:0.2651739952):0.1207705517,Mesopsocus_fuscifrons:0.5295638952):0.2783771462):0.0438495049):0.0267814652):0.0236199507):0.0705190996,(((((Platycnemis_pennipes:0.0755458085,Ischnura_elegans:0.0899286549):0.0175863182,(Calopteryx_splendens:0.055178131,Hetaerina_americana:0.0610935049)f_Calopterygidae:0.0296085432):0.0613672874,(Tanypteryx_hageni:0.0901763678,((Sympetrum_striolatum:0.0535801064,Ladona_fulva:0.0424251223):0.0134245675,Pantala_flavescens:0.068438368)f_Libellulidae:0.1287469524):0.0872039862):0.0890892491,Rhinocypha_anisoptera:0.4995349469)\
o_Odonata:0.3167927006,((Ecdyonurus_torrentis:0.1628476235,Siphlonurus_alternatus:0.1505399239):0.1298550541,Cloeon_dipterum:0.5099727532)o_Ephemeroptera:0.3298411808):0.0511989531)c_Insecta:0.1630361749,(Campodea_augens:0.6498309978,Catajapyx_aquilonaris:0.5209834934)o_Diplura:0.1880639788):0.0625022223,((((Lepeophtheirus_salmonis:0.814283749,((Tisbe_holothuriae:0.5451362591,Tigriopus_californicus:0.5415784813)o_Harpacticoida:0.1297992109,(Paracyclopina_nana:0.2618971145,Oithona_nana:0.3275886035)o_Cyclopoida:0.3796736572):0.0782330424):0.1228697799,Eurytemora_affinis:0.7989720325)c_Hexanauplia:0.3526094382,(((((((Allacma_fusca:0.1140543781,Lipothrix_lubbocki:0.1467621729)f_Sminthuridae:0.1201704041,Pseudobourletiella_spinata:0.2243147206):0.0554715126,Sminthurides_aquaticus:0.3608502074):0.058542345,Pygmarrhopalites_habei:0.2951942267)o_Symphypleona:0.2202152223,\
(((((((Sinella_curviseta:0.0940923233,Entomobrya_proxima:0.1188181928)f_Entomobryidae:0.028858602,Akabosia_matsudoensis:0.1837813106):0.0504025816,Cyphoderus_albinus:0.1923790957):0.0361771885,Orchesella_cincta:0.162277405):0.2778754237,(Folsomia_candida:0.3503608737,Desoria_tigrina:0.2307150912)f_Isotomidae:0.1524298055):0.0934795811,Oncopodura_yosiiana:0.4435821299):0.0261723258,((((Tomocerus_qinae:0.083708695,Yoshiicerus_persimilis:0.098890703):0.069159779,Pogonognathellus_flavescens:0.1525620152):0.0306922874,Plutomurus_gul:0.1715293749)f_Tomoceridae:0.196016419,Harlomillsia_oculata:0.5279297241):0.0456375698)o_Entomobryomorpha:0.0687806168):0.0348130139,(((Holacanthella_duospinosa:0.2171293242,\
((((Neanura_muscorum:0.1308681932,Bilobella_aurantiaca:0.1639005203):0.0253284042,Rambutanura_hunanensis:0.1867243972):0.1146332195,Pseudachorutes_palmiensis:0.2417145805):0.0615707169,Brachystomella_parvula:0.2312591371):0.0302910082)f_Neanuridae_-1:0.2068784852,Ceratophysella_communis:0.3196265061):0.1219692154,(Thalassaphorura_encarpata:0.3813194504,Mesaphorura_yosii:0.5126129632):0.0597183815)o_Poduromorpha:0.1045242241):0.0663247817,Neelides_sp._FZ-2019:0.5508302147)c_Collembola:0.6636347495):0.0708054803,(Branchinecta_lindahli:0.863794643,(((Chydorus_sphaericus:0.233576778,(Ceriodaphnia_dubia:0.0756846562,Daphnia_carinata:0.0974302282)f_Daphniidae:0.1275053799):0.2750069287,(Eulimnadia_texana:0.1520965678,Leptestheria_dahalacensis:0.1491253674):0.240533479)o_Diplostraca:0.1739543621,(Lepidurus_apus_lubbocki:0.1398470209,Triops_longicaudatus:0.1141149409)o_Notostraca:0.4283772548):0.1102998069)c_Branchiopoda:0.1662501115):0.0412032427):0.0440873438,\
(((((Bathynomus_jamesi:0.2107119144,Armadillidium_nasatum:0.3025281274)o_Isopoda:0.3317963268,((((Cherax_quadricarinatus:0.1356375925,Procambarus_clarkii:0.087851065):0.0401768398,Homarus_americanus:0.1206789354):0.0515558153,(Paralithodes_platypus:0.3258347792,((Chionoecetes_opilio:0.1296949686,((Portunus_trituberculatus:0.0358839063,Callinectes_sapidus:0.0403566458)f_Portunidae:0.0650220465,Metacarcinus_magister:0.09344829):0.0173653891):0.038790673,Eriocheir_sinensis:0.1174578251):0.14486112):0.0388914425):0.0650246463,Penaeus_japonicus:0.1893476414)o_Decapoda:0.1755075151):0.0768743018,(Parhyale_hawaiensis:0.1856810117,(((Morinoia_aosen:0.018680129,Platorchestia_sp._MABIK:0.026367051):0.050812094,Trinorchestia_longiramus:0.0826500767)f_Talitridae:0.0975975167,Hyalella_azteca:0.1831370033):0.0602589477)o_Amphipoda:0.6853306105)c_Malacostraca:0.36101829,((Amphibalanus_amphitrite:0.1592090642,(Pollicipes_pollicipes:0.125543532,Capitulum_mitella:0.1189311334)\
o_Pollicipedomorpha:0.0601240689):0.2331637736,Sacculina_carcini:0.9316640187)c_Thecostraca:0.5273542758):0.0824044064,(Darwinula_stevensoni:0.6836223972,Notodromas_monacha:1.053911026)c_Ostracoda:0.2589584783):0.0531313806):0.1670279833,(((Rhysida_immarginata:0.4004456294,Strigamia_acuminata:0.4976819586):0.0832257819,Thereuonema_tuberculata:0.4162394981)c_Chilopoda:0.1293463239,((Trigoniulus_corallinus:0.385382762,Helicorthomorpha_holstii:0.5298699893):0.151159736,Glomeris_maerens:0.5932630021)c_Diplopoda:0.1044656404):0.077010817):0.1425437694,((((Haemaphysalis_longicornis:0.116701595,((Dermacentor_andersoni:0.0458386662,(Rhipicephalus_sanguineus:0.0402034659,Hyalomma_asiaticum:0.0479695554):0.0210079425):0.0483925461,Amblyomma_maculatum:0.0958936554):0.0361876546):0.1514286726,Ixodes_scapularis:0.1870415965)o_Ixodida:0.3080119678,((Dermanyssus_gallinae:0.1883680514,((Stratiolaelaps_scimitus:0.0920760705,Varroa_jacobsoni:0.1218409306):0.052441357,Tropilaelaps_mercedesae:0.1519896974)\
f_Laelapidae+Varroidae:0.0765744195):0.1429914177,(Neoseiulus_cucumeris:0.1001332067,Galendromus_occidentalis:0.1226184952)f_Phytoseiidae:0.2437539728)o_Mesostigmata:0.88820897):0.2044806119,(((((((Rhizoglyphus_robini:0.1757792517,Tyrophagus_putrescentiae:0.3532875995)f_Acaridae:0.0502831925,Blomia_tropicalis:0.2833134545):0.1615002098,(((Dermatophagoides_pteronyssinus:0.1432744897,Psoroptes_ovis:0.2434080758):0.1560114175,Amerodectes_protonotaria:0.2715251518):0.0569228041,Sarcoptes_scabiei:0.4618713344):0.2199599375):0.6417121219,(((((Medioppia_subpectinata:0.1448861481,Oppiella_nova:0.1191998157):0.0743222065,Oppia_nitens:0.2673522027)f_Oppiidae:0.0713720673,Achipteria_coleoptrata:0.1845303808):0.1557535184,(Archegozetes_longisetosus:0.1168812989,Platynothrus_peltifer:0.1332450894):0.0619225399):0.0851646395,\
Steganacarus_magnus:0.3865441381):0.0805912075):0.0727045744,Hypochthonius_rufulus:0.4028213646):0.1678817719,Osperalycus_tenerphagus:0.5303839132)o_Sarcoptiformes:0.0592825389,(((Dinothrombium_tinctorium:0.2531971369,Leptotrombidium_deliense:0.335554107):0.2595943597,(((Tetranychus_urticae:0.1501977939,Panonychus_citri:0.1817513838)f_Tetranychidae:0.2841259022,Brevipalpus_yothersi:0.5391962079):0.3802932528,Pyemotes_zhonghuajia:1.002338906):0.0829370466):0.0915844641,Halotydeus_destructor:0.7381078501)o_Trombidiformes:0.0974198436):0.3785952377):0.0461061048):0.0459139539,(((((Pardosa_pseudoannulata:0.0819129965,Dolomedes_plantarius:0.0748515529):0.0856376192,Amaurobius_ferox:0.1519732506):0.1013633453,(((((((Araneus_ventricosus:0.0502641314,Argiope_trifasciata:0.0613429125):0.0796941675,Caerostris_darwini:0.1761161603)f_Araneidae:0.0215142579,(Trichonephila_clavipes:0.086488927,Nephila_pilipes:0.0763622508)f_Nephilidae:0.0731869318):0.0754482262,(Hylyphantes_graminicola:0.021442607,Oedothorax_gibbosus:0.0214536191)\
f_Linyphiidae:0.2334817086):0.0228118745,((Metellina_segmentata:0.0372480037,Meta_bourneti:0.033806446):0.075005529,Tetragnatha_versicolor:0.1978964953)f_Tetragnathidae:0.1057799247):0.0449554032,(Latrodectus_elegans:0.1507277398,Parasteatoda_lunata:0.1862132012)f_Theridiidae:0.1082339534):0.056688435,Stegodyphus_mimosarum:0.2006039453):0.0294324408):0.221752827,Dysdera_silvatica:0.4820002003)o_Araneae:0.2342113719,Centruroides_sculpturatus:0.4661311557):0.0597790796):0.0434218047,Phalangium_opilio:0.5770701909):0.3858076784,(Tachypleus_tridentatus:0.0182328416,Carcinoscorpius_rotundicauda:0.0200429871):0.0439207372):0,Limulus_polyphemus:0.056107225)
`;

var fungi_string = 
`(((((((((Pneumocystis_murina_B123:0.7962553623,((Protomyces_gravidus:0.3208161297,Taphrina_betulina:0.2395271703)c_Taphrinomycetes:0.4234037497,(Schizosaccharomyces_cryophilus_OY26:0.8089999176,Novakomyces_olei:0.7086248762):0.1429738842):0.0424648641):0.0576901872,(Saitoella_complicata_NRRL_Y-17804:0.4997074882,Neolecta_irregularis_DAH-3:0.659949398):0.0654096292):0.0339477358,(((((((((Wickerhamiella_infanticola:0.4009967761,Starmerella_vaccinii:0.6208831766):0.3619105308,Deakozyma_indianensis:0.566124331):0.0951594716,\
((((Diddensiella_caesifluorescens:0.2583369826,Sugiyamaella_xylanicola__nom._inval._:0.3004195737):0.0377359135,Spencermartinsiella_europaea:0.3416210229):0.0277507572,(Zygoascus_meyerae:0.4412216711,Groenewaldozyma_salmanticensis:0.444021547):0.063936963):0.0431549455,(Blastobotrys_serpentis:0.1196596537,Trichomonascus_ciferrii:0.1176122137):0.2564566523):0.0380387719)f_Trichomonascaceae_-5:0.0534612612,(Middelhovenomyces_tepae:0.345916733,((Dipodascus_geniculatus:0.2235143473,(Galactomyces_reessii:0.0476505293,Geotrichum_bryndzae:0.0468158226):0.1182553435):0.1576962484,\
(Magnusiomyces_ingens_NRRL_Y-17630:0.0343800881,Saprochaete_ingens:0.0329451649):0.3769177242):0.1318478527):0.0482940564):0.0885304891,(Nadsonia_starkeyi-henricii:0.4333938974,Yarrowia_hollandica:0.6021916062):0.078498956):0.0665264504,(((((((Komagataella_ulmi:0.4438701877,Citeromyces_matritensis:0.4807295781):0.0557581084,(((((((Saturnispora_dispora:0.3003219203,Martiniozyma_abietophila:0.2380342316):0.1366815015,Pichia_sp._PH4023:0.2844849224):0.0941627955,Kregervanrija_fluxuum:0.200892333):0.1460746742,Brettanomyces_naardenensis:0.381532043):0.0669764684,Ambrosiozyma_kashinagicola:0.2756582163):0.1041380534,Ogataea_methylovora:0.2462339731)\
f_Pichiaceae_-1:0.1540149947,Kuraishia_ogatae:0.3230730073):0.053200694):0.0480381074,((Nakazawaea_ishiwadae:0.2709406898,Peterozyma_toletana:0.2766397938):0.0536243676,Pachysolen_tannophilus_NRRL_Y-2460:0.2496896539):0.1604790982):0.1070534317,((Limtongozyma_cylindracea:0.6682328469,Babjeviella_inositovora_NRRL_Y-12698:0.2632839633):0.2101874515,(((((((Danielozyma_ontarioensis:0.2001195465,Hyphopichia_homilentoma:0.1985490335):0.0595745328,(Metschnikowia_agaves:0.2422985277,Clavispora_lusitaniae:0.1981376116):0.1738167276):0.0421427626,(Priceomyces_carsonii:0.2841264123,\
(((Teunomyces_kruisii:0.1778931691,Wickerhamia_fluorescens:0.2442570535):0.035922611,(Suhomyces_tanzawaensis_NRRL_Y-17324:0.1852322971,(Kodamaea_laetipori:0.1607839073,Aciculoconidium_aculeatum:0.2150888916):0.1219278752):0.0358611572):0.030252927,(((Spathaspora_passalidarum_NRRL_Y-27907:0.2043849152,(Lodderomyces_elongisporus:0.2857554815,Candida_sanyaensis:0.1916080025):0.0690153032):0.0622332897,Diutina_rugosa:0.575943172):0.0369363999,Scheffersomyces_shehatae:0.1702414934):0.023440591):0.0522450302):0.0290178123):0.0185766145,(Debaryomyces_maramus:0.152174568,Millerozyma_farinosa:0.3041919613):0.0545255613):0.0186788763,(Meyerozyma_guilliermondii:0.2929275513,Yamadazyma_tenuis:0.3650496187):0.0399181866):0.0568411793,Kurtzmaniella_fragi:0.3659166969)f_Debaryomycetaceae_-12:0.2460980455,Cephaloascus_albidus:0.3104869681):0.0839459104):0.0677687655):0.0496559913,\
((((((Eremothecium_cymbalariae_DBVPG_7215:0.3007659283,Kluyveromyces_lactis:0.3072176302):0.0511283514,Lachancea_quebecensis:0.2748102704):0.0382119541,((((Torulaspora_quercuum:0.1407959643,Zygotorulaspora_mrakii:0.1971147582):0.0424867587,Zygosaccharomyces_parabailii:0.2429391145):0.0707741672,((((Kazachstania_africana_CBS_2517:0.2180564738,Grigorovia_transvaalensis:0.3556509937):0.0623456668,Naumovozyma_castellii_NRRL_Y-12630:0.2188168333):0.0330649487,Saccharomyces_sp._M14:0.2280264508):0.0264576095,Nakaseomyces_nivariensis:0.2830211031):0.0339106521):0.022082889,(Yueomyces_sp._HY-2023a:0.3926202411,(Tetrapisispora_iriomotensis:0.2418609055,Vanderwaltozyma_polyspora_DSM_70294:0.1887691923):0.0707642807):0.0361833998):0.0995382038):0.075539041,(Hanseniaspora_occidentalis_var._citrica:0.4061308592,Saccharomycodes_ludwigii:0.276560007)f_Saccharomycodaceae:0.1803951814):0.3284679448,\
(((Barnettozyma_botsteinii:0.0971726872,Phaffomyces_thermotolerans:0.140167308):0.1877680217,(Wickerhamomyces_hampshirensis:0.2005959804,Cyberlindnera_mrakii:0.2216061667):0.0621127614):0.0525620161,Starmera_quercuum:0.2516920065):0.1747037958):0.0861038453,(Ascoidea_rubescens_DSM_1968:0.5098107355,Saccharomycopsis_fibuligera_x_Saccharomycopsis_cf._fibuligera:0.468125421):0.1831379784):0.0400475264):0.1959229177,Sporopachydermia_quercuum:0.5442577971):0.0501389947,Alloascoidea_hylecoeti:0.5196746518):0.1526857236):0.1205969964,(Tortispora_caseinolytica_NRRL_Y-17796:0.8153437038,Trigonopsis_variabilis:0.6021673471)f_Trigonopsidaceae:0.1036236956):0.0645673347,(Kockiozyma_suomiensis:0.2460756116,Lipomyces_lipofer:0.1892057794)f_Lipomycetaceae:0.2832050733)c_Saccharomycetes_-45:0.1691739967,((((((((((((((Herpomyces_periplanetae:0.827264915,Eremomyces_bilateralis_CBS_781.70:0.2552324769):0.1239124503,((Trichodelitschia_bisporula:0.2819028122,(((Verruconis_gallopava:0.0480915216,Scolecobasidium_constrictum_UM_578:0.0433733237)\
f_Sympoventuriaceae:0.2643322803,Venturia_aucupariae:0.2339737997):0.04419537,Tothia_fuscella:0.2104742319)o_Venturiales:0.064929047):0.0404043483,Microthyrium_microscopicum:0.41743686):0.0721418993):0.0288186479,(Aulographum_hederae_CBS_113979:0.3106564298,Rhizodiscina_lignyota:0.2624600161)o_Aulographales:0.0394838584):0.0433482026,((((Myrmaecium_sp._VS_I_D_KN_1:0.2339487589,Pseudovirgaria_hyperparasitica:0.3208849595):0.0320062723,(((((((((Sporormia_fimetaria_CBS_119925:0.1406838128,Westerdykella_sp._P71:0.1044116772)f_Sporormiaceae:0.0618736201,Lophiostoma_macrostomum_CBS_122681:0.1226736251):0.018876201,(Dendryphion_nanum:0.1608172681,Nigrograna_mackinnonii:0.0933919352):0.0140400738):0.0180220267,((((((((((((((Paradendryphiella_salina:0.0155595348,Stemphylium_lycopersici:0.0134461096):0.0202324856,((Curvularia_lunata_CX-3:0.0262441616,Bipolaris_zeicola:0.0244267478):0.0117205037,Exserohilum_rostratum:0.0284071097):0.0189709028):0.019272036,Alternaria_infectoria:0.0458412624):0.0074928536,Pyrenophora_teres_f._teres:0.0519162938):0.0156483292,Decorospora_gaudefroyi:0.0638723161)f_Pleosporaceae:0.0195249512,\
Clathrospora_elynae:0.0632463684):0.0248764242,(Plenodomus_biglobosus:0.0740998253,Coniothyrium_glycines:0.0782782381):0.0113883552):0.0118781187,((Cucurbitaria_berberidis_CBS_394.84:0.036110725,Parafenestella_ontariensis:0.0271035621):0.0157542332,(Pyrenochaeta_sp._MPI-SDFR-AT-0127:0.0210500463,Pseudopyrenochaeta_lycopersici:0.0219711652):0.0294390762)f_Cucurbitariaceae_-1:0.0123373116):0.0188154899,(Shiraia_sp._slf14:0.0703103265,((Paraphoma_sp._B47-9:0.0318587553,Setomelanomma_holmii:0.0333831098):0.0266633083,((((Phaeosphaeria_sp._A1_3.1a:0.0563595311,Ampelomyces_quisqualis:0.0559843268):0.0106867832,Parastagonospora_avenae_f._sp._tritici:0.0566981472):0.0159854626,Ophiobolus_disseminans:0.0574270376):0.007695019,Ophiosphaerella_narmari:0.0853149833):0.0051268931)f_Phaeosphaeriaceae_-4:0.0162207325):0.0256604148):0.0175975244,((Neodidymelliopsis_sp._IMI_364377:0.0261929641,(((((Stagonosporopsis_rhizophila:0.0250163597,Boeremia_lycopersici:0.0459802213):0.008865741,Epicoccum_latusicollum:0.0402535646):0.0044883132,Sclerotiophoma_versabilis:0.0204211008):0.0066076818,\
(Didymella_segeticola:0.0298041727,Phoma_herbarum:0.0232461647):0.0149605567):0.0169054503,(Lizonia_empirigonia:0.0304303961,Ascochyta_koolunga:0.0330006021):0.0072218057):0.0107028747)f_Didymellaceae_-2:0.0787058201,Dothidotthia_symphoricarpi_CBS_119687:0.0921762695):0.015774853):0.0597689915,Acrocalymma_vagum:0.0879130501):0.0336610736,((((((Didymosphaeria_variabile:0.0172487444,Paraconiothyrium_sp._Pb-2020:0.0137544495):0.0183173309,(Karstenula_rhodostoma_CBS_690.94:0.0216115463,Paraphaeosphaeria_minitans:0.0373730579):0.026338168):0.0181908006,Paracamarosporium_sp._OC-R06-R3:0.0342534111):0.0110245468,(Pseudopithomyces_maydicus:0.0606559587,Bimuria_novae-zelandiae_CBS_107.79:0.057908367):0.0204236762)f_Didymosphaeriaceae:0.10512965,(Lentithecium_fluviatile_CBS_122367:0.0917417343,Periconia_macrospinosa:0.1356844454):0.0178200474):0.0237684915,\
(Pseudomonodictys_sp._A73:0.1144723797,Trematosphaeria_pertusa:0.0799003225):0.0164429888):0.0319985389):0.0140942933,(Massariosphaeria_phaeospora:0.1441883411,Corynespora_cassiicola:0.1143194445):0.0183639643):0.0201810915,(Clavariopsis_aquatica:0.0507026895,Melanomma_pulvis-pyrius_CBS_109.77:0.050372483):0.0890502037):0.0142807808):0.0134736746,Polyplosphaeria_fusca:0.1772777724):0.0210729604,Clohesyomyces_aquaticus:0.1342444658)o_Pleosporales_-32:0.029473593,Zopfia_rhizophila_CBS_207.26:0.0923443522):0.0709249906,(Hysterium_pulicare_CBS_123377:0.0967337833,Rhytidhysteron_rufulum_CBS_306.38:0.1210655095)o_Hysteriales:0.0350020041):0.0478776157,(Glonium_stellatum:0.0998778892,((Lophium_mytilinum:0.0230930933,Mytilinidion_resinicola:0.023230206)f_Mytilinidiaceae:0.1622573517,Lepidopterella_palustris_CBS_459.81:0.1088852644)o_Mytilinidiales:0.0196912616):0.0240045713):0.0812202989):0.035828982,(Coniosporium_apollinis_CBS_100218:0.2218891502,(Saccharata_proteae_CBS_121410:0.1604102208,(Aplosporella_prunicola_CBS_121167:0.1256179491,(Phyllosticta_citriasiana:0.1604129649,(((Diplodia_sapinea:0.0462029816,Lasiodiplodia_pseudotheobromae:0.0298460655):0.0307926507,\
(Neoscytalidium_dimidiatum:0.0385279124,(Botryosphaeria_kuwatsukai:0.032118978,Macrophomina_tecta:0.0348129725):0.0110807686):0.0144157499):0.0086116253,(Neofusicoccum_laricinum:0.0437131598,Dothiorella_sarmentorum:0.069947404):0.0155530374)f_Botryosphaeriaceae:0.0658329568):0.0443854811):0.0416918882)o_Botryosphaeriales:0.0931300355):0.0237201598):0.0193508998,(Patellaria_atrata_CBS_101060:0.2810039229,Lineolata_rhizophorae:0.3194515665):0.0419619246):0.0164334264):0.0379227876,((((((((((Piedraia_hortae_CBS_480.64:0.4138421759,Acidomyces_sp.__richmondensis_:0.1424115573):0.0391710038,Teratosphaeria_pseudoeucalypti:0.1592360989):0.0347035725,((Salinomyces_thailandica:0.111734227,Hortaea_werneckii:0.1063576539):0.097924936,((Acidiella_bohemica:0.1644713402,Friedmanniomyces_simplex:0.1286799463):0.0353269796,Neocatenulostroma_microsporum:0.1330179267):0.0336910823):0.0137024955):0.0316915645,Microcyclospora_pomicola:0.1948398879):0.0240052388,((Neohortaea_acidophila:0.1944722349,Aeminium_ludgeri:0.2150904304):0.0511480289,(((((Exutisphaerella_laricina_CBS_326.52:0.0855290285,Passalora_sequoiae:0.0800346247):0.0212861717,\
(((Nothopassalora_personata:0.0114817865,Mycosphaerella_arachidis:0.0093633743):0.0245012763,Fulvia_fulva:0.0335874325):0.008509712,Dothistroma_septosporum:0.0439609362):0.0503942008):0.0723072053,(Microcyclosporella_mali:0.0440857217,Mycosphaerelloides_madeirae:0.0488929975):0.1064788221):0.0204142388,((((Septoria_petroselini:0.0595057746,Sphaerulina_populicola_P02.02b:0.0850632754):0.0169698353,Cercospora_apii:0.0520227057):0.0946870343,Nothophaeocryptopus_gaeumannii_CBS_267.37:0.1085699757):0.0172796135,Pseudocercospora_fijiensis_CIRAD86:0.1494571892):0.0349066144):0.0196783415,(Zymoseptoria_passerinii_SP63:0.0980300271,Ramularia_endophylla_CBS_113265:0.1166061123):0.0602498013)f_Mycosphaerellaceae:0.0731511458):0.0129717611)o_Mycosphaerellales_-7:0.0296929138,(Peltaster_fructicola:0.2494215299,((Melanodothis_sp._VS_III_D_KN_1:0.0348836083,Cladosporium_tenuissimum:0.0362353776):0.1358532146,Rachicladosporium_antarcticum:0.2104707187)o_Cladosporiales:0.0488991093):0.0479785508):0.0292767892,Leptoxyphium_fumago:0.2731535529):0.1391536661,(((Sphaceloma_murrayae:0.0895397749,Elsinoe_perseae:0.0834339084)f_Elsinoaceae:0.0750664357,Myriangium_duriaei_CBS_260.36:0.1285222156)\
o_Myriangiales:0.1529420103,Aureobasidium_uvarum:0.2282815607):0.0587724083):0.1023373325,Cryomyces_minteri:0.201730872):0.0351392205,((((Trypethelium_eluteriae:0.0048424818,Viridothelium_virens:0.0056507671):0.0875299471,Astrothelium_subdiscretum:0.0791450837):0.0199579473,Bathelium_mastoideum:0.1111583897):0.0545468265,Bogoriella_megaspora:0.1780534234)o_Trypetheliales:0.2042859059):0.0209305518):0.0159219795,Floridaphiala_radiotolerans:0.2931607564):0.0276826133,((Chrysothrix_sp._TS-e1954:0.3505778069,(Alyxoria_varia:0.3233441545,Arthonia_radiata:0.3676269244):0.0597183494)c_Arthoniomycetes:0.1751026005,Lichenothelia_convexa:0.2378561092):0.0436310603):0.1149940265,(Symbiotaphrina_buchneri:0.2338109555,Sarea_resinae:0.1865337956):0.0230155236):0.0165993429,((((((Ascosphaera_aggregata:0.3712893704,(((Onygena_corvina:0.0767439843,((Trichophyton_verrucosum_HKI_0517:0.0237174687,Nannizzia_gypsea_CBS_118893:0.026187978):0.0207804975,Microsporum_canis:0.0526208228):0.0282495916):0.1479126521,(((Ophidiomyces_ophidiicola:0.1125624963,((Uncinocarpus_reesii_1704:0.0589524703,Nannizziopsis_barbatae:0.120702317):0.0143510982,\
((Byssoonygena_ceratinophila:0.0613272771,Chrysosporium_queenslandicum:0.0395742578):0.0146390184,(Coccidioides_immitis_RS:0.0530505549,Amauroascus_verrucosus:0.0600521274):0.0069823496):0.0108378341):0.0092431577):0.0072970478,Emydomyces_testavorans:0.0748102082):0.0115042346,Aphanoascus_verrucosus:0.0763839438):0.0869009279)f_Onygenaceae_-4:0.0414545395,(((Emergomyces_africanus:0.0382385875,Emmonsia_crescens:0.0241419721):0.0079404853,(Blastomyces_emzantsi:0.0402792247,Histoplasma_capsulatum_var._capsulatum_Tmu:0.0486632472):0.0147431998)f_Ajellomycetaceae:0.0286198178,Paracoccidioides_brasiliensis_Pb18:0.0748691046):0.097973149):0.0249352742)o_Onygenales:0.0442429412,(((Xeromyces_bisporus:0.1501629213,Monascus_purpureus:0.0785094739):0.0580009753,(Penicillium_verrucosum:0.1917468325,(Aspergillus_japonicus_CBS_114.51:0.1172015297,Scortechinia_acanthostroma:0.0849549526):0.0261655952):0.0236697032)f_Aspergillaceae_-2:0.0562913293,(((Rasamsonia_emersonii_CBS_393.64:0.0906275709,Talaromyces_trachyspermus:0.1932726145)f_Trichocomaceae:0.0321421194,Elaphomyces_granulatus:0.1732028818):0.0313253913,Paecilomyces_fulvus:0.1083607405):0.0227235207)o_Eurotiales_-4:0.0707152733):0.09021741,\
(((((Neophaeococcomyces_aloes:0.1266953932,((Incumbomyces_lentus:0.1147345168,Pasadenomyces_melaninifex:0.1629983828):0.0266838845,(Arthrocladium_fulminans:0.0615805607,Knufia_fluminis:0.0908223132):0.0297009433):0.0440149155):0.1754678925,(Cyphellophora_europaea_CBS_101466:0.2462729792,(((Cladophialophora_carrionii:0.0283755534,Phialophora_expanda:0.0248184306):0.0683604481,Fonsecaea_monophora:0.0744161078):0.0620224011,Exophiala_lecanii-corni:0.1365808835)f_Herpotrichiellaceae:0.0647922963):0.0335198379):0.1208595379,Endocarpon_pusillum:0.2191692944):0.0542494194,(Pseudophaeomoniella_oleicola:0.0969819311,Phaeomoniella_chlamydospora:0.0989795112)o_Phaeomoniellales:0.1723362694):0.0259826258,Pyrenula_aspistea:0.3049792465):0.1033329802):0.0815448967,Cirrosporium_novae-zelandiae:0.3406294366):0.0621309585,(((((Bachmanniomyces_sp._S44760:0.2017278213,Schaereria_dolodes:0.1528845128):0.0258415871,(((((Gomphillus_americanus:0.2919078527,(Diploschistes_diacapsis:0.1612173564,Thelotrema_lepadinum:0.1692601717):0.0779019801)f_Graphidaceae:0.0903733282,Cyanodermella_asteris:0.4424753973):0.0396059387,Stictis_urceolata:0.2883245582)o_Ostropales:0.083115725,(Trapelia_coarctata:0.126661799,Xylographa_soralifera:0.1225445426)o_Trapeliales:0.0496018198):0.0281433084,(Agyrium_rufum:0.2926876021,Icmadophila_ericetorum:0.1934661958)o_Pertusariales:0.0422150203):0.025799431):0.032368747,\
((((((((((Variospora_aurantia:0.0413176746,Seirophora_lacunosa:0.0401953305):0.0528818487,Caloplaca_aetnensis:0.0821962198):0.0141800621,Usnochroma_carphineum:0.0743626685):0.0195866777,Gyalolechia_flavorubescens_KoLRI002931:0.0981049325):0.0255936403,((Teloschistes_peruensis:0.0256069422,Niorma_chrysophthalma:0.0227780703):0.1215760133,(Xanthomendoza_cf._fulva:0.0725054546,((Xanthoria_mediterranea:0.0348553813,Rusavskia_elegans:0.021447542):0.0143224356,Flavoplaca_oasis:0.0541079687):0.0452009099):0.045259997):0.0149045942)f_Teloschistaceae:0.0763459886,Letrouitia_transgressa:0.2147305495)o_Teloschistales:0.0705631422,(Heterodermia_speciosa:0.087651649,Physcia_stellaris:0.0782993165)o_Caliciales:0.1621475642):0.0236388835,((((Puttea_exsequens:0.1908215183,(Stereocaulon_alpinum:0.0942257657,Cladonia_rangiferina:0.0988559137):0.0353362754):0.0230342167,(((Imshaugia_aleurites:0.0506474083,Parmelia_sp._050094:0.0649534165):0.0064909401,(Letharia_lupina:0.0356140744,Alectoria_fallacina:0.0555513428):0.0062852853):0.0042015163,((Pseudevernia_furfuracea:0.0486618062,Usnea_hakonensis:0.0790937777):0.0062114191,Evernia_prunastri:0.0537392962):0.004001529)f_Parmeliaceae:0.0858573941):0.016074831,Mycoblastus_sanguinarius:0.1184360786):0.0340444078,((Ramalina_farinacea:0.0460831162,Niebla_homalea:0.0476385219):0.1377716752,Bacidia_gigantensis:0.215463983)f_Ramalinaceae:0.1270947811)o_Lecanorales:0.06208488):0.0194621583,((Pseudocyphellaria_aurata:0.068641423,\
(Sticta_canariensis:0.0571344291,Lobaria_immixta:0.0454271221):0.0094223755)f_Lobariaceae:0.0589888326,Peltigera_leucophlebia:0.159233646)o_Peltigerales:0.0783031147):0.0319607581,Toensbergia_leucococca:0.1600174158):0.0263550354):0.0205180098,(Hypocenomyce_scalaris:0.0459388212,(Lasallia_pustulata:0.0614192594,Umbilicaria_grisea:0.0560124242)f_Umbilicariaceae:0.0228810896)o_Umbilicariales:0.0756940963):0.0570934644,Pleopsidium_flavum:0.1375477095):0.0263735987):0.0352795189,(Pycnora_praestabilis:0.137120403,(Candelaria_pacifica:0.0475553901,Candelina_mexicana:0.0575782019)f_Candelariaceae:0.1368170526)c_Candelariomycetes:0.0493545958):0.016550161):0.0322092583,(Vezdaea_acicularis:0.3412948507,(((Sarcosagium_campestre:0.1923740342,Piccolia_ochrophora:0.1515830896):0.089324933,((Phylliscum_demangeonii:0.2883479307,Peltula_sp._TS41687:0.1653525867):0.0450807224,(Lichina_confinis:0.2277715551,Watsoniomyces_obsoletus:0.2050996353):0.0710840931)c_Lichinomycetes:0.076624775):0.021231273,((Caeruleum_heppii:0.196693853,Thelocarpon_impressellum:0.1798181776):0.0403995781,(Chaenotheca_gracillima:0.1420154711,Sclerophora_amabilis:0.1030474138)c_Coniocybomycetes:0.1155057627):0.0141324327):0.0288745758):0.021214946):0.0175971992,((((((((((((((((Chrysosphaeria_jannelii:0.4603679975,Intubia_oerlemansii:0.1075493769):0.0405678577,Ophiostoma_montium:0.139796995):0.0255463251,\
Sporothrix_cf._nigrograna:0.1056298026):0.0333992697,Ceratocystiopsis_sp._VPRI43766:0.1650632699):0.0166617646,(Fragosphaeria_purpurea:0.1155825432,Hawksworthiomyces_lignivorus:0.0829352954):0.0192141292):0.0243300472,(((Dryadomyces_quercivorus:0.0834924235,Esteya_vermicola:0.1256655312):0.0188349257,(Leptographium_wingfieldii:0.0018272914,Grosmannia_clavigera_kw1407:0.0029848919):0.091987005):0.0435857775,(Harringtonia_lauricola:0.0836034992,Raffaelea_sp._RL272:0.0787261422):0.0536916711):0.0224142846):0.0185524934,Graphilbum_cf._rectangulosporium:0.1601857129)o_Ophiostomatales:0.1147305682,Barbatosphaeria_neglecta:0.1643078807):0.0823101603,(((Nakataea_oryzae:0.036632568,((Magnaporthiopsis_rhizophila:0.0321775787,Gaeumannomyces_tritici_R3-111a-1:0.0415643495):0.0086349624,Falciphora_oryzae:0.0176898713):0.0119826433):0.0823793176,Magnaporthe_sp._MG07:0.1458108163)f_Magnaporthaceae:0.0412721333,(Pseudohalonectria_lignicola:0.1259697449,Ophioceras_dolichostomum:0.1447562143)f_Ophioceraceae:0.0206809629)o_Magnaporthales:0.1079102429):0.0304377486,((Cytospora_paraplurivora:0.0920808877,Diaporthe_capsici:0.1018917743):0.0346367352,(((Aurifilum_marmelostoma:0.0222019576,Cryphonectria_parasitica:0.021828372):0.0204638981,Chrysoporthe_cubensis:0.0305866776)f_Cryphonectriaceae:0.0490021436,((Gnomoniopsis_castaneae:0.0403995832,Ophiognomonia_clavigignenti-juglandacearum:0.1038534374)f_Gnomoniaceae:0.0275754664,Juglanconis_oblonga:0.0371443266):0.0446238672):0.0481037975)\
o_Diaporthales:0.1740045243):0.0185666044,(((((Thermochaetoides_dissita:0.1698787874,((((Collariella_sp._IMI_366227:0.0100196823,Chloridium_humicola:0.005347269):0.0850380086,(Chaetomium_cochliodes:0.0835494012,Staphylotrichum_longicolle:0.0566905882):0.0187871195):0.0204852356,Trichocladium_uniseriatum:0.0734842186):0.016182672,Madurella_mycetomatis:0.0872313711):0.0201259017)f_Chaetomiaceae_-3:0.0231763088,Podospora_anserina:0.1854920394):0.034142333,Neurospora_crassa_OR74A:0.1688910107)o_Sordariales_-6:0.0714438045,(Phyllachora_maydis:0.26939361,Thozetella_sp._PMI_491:0.1784940044):0.0305643551):0.027310246,Coniochaeta_hoffmannii:0.2217110007):0.0450912194):0.0341938508,((((((((Chalaropsis_thielavioides:0.0367640715,Berkeleyomyces_rouxiae:0.0485276405):0.0690545728,(Endoconidiophora_polonica:0.0338377485,Davidsoniella_virescens:0.0354610846):0.0831107621):0.0136634838,Thielaviopsis_punctulata:0.0926909667):0.0189494813,(Huntiella_fecunda:0.1417080618,(Bretziella_fagacearum:0.0618527574,((Meredithiella_fracta:0.0737698089,Ceratocystis_adiposa:0.0369040922):0.0614472778,Ambrosiella_xylebori:0.1039980873):0.0305190014):0.016184824):0.0715625379)f_Ceratocystidaceae:0.1868324442,Knoxdaviesia_proteae:0.2041773556):0.093970824,(Graphium_sp._VPRI43844:0.2260412358,(((Microascus_cirrosus:0.0797586342,Scopulariopsis_brevicaulis:0.0827318317):0.0856778734,Basipetospora_chlamydospora:0.1451580832):0.0247733516,Scedosporium_boydii:0.1062111263)f_Microascaceae_-1:0.1284983493):0.0297309541)o_Microascales:0.0592212448,\
(((((((Torrubiellomyces_zombiae:0.1749966033,(((((Claviceps_monticola:0.0963347954,Aciculosporium_take_MAFF-241224:0.0840816792):0.0247763664,Epichloe_festucae:0.0526438039):0.0106424156,((Balansia_obtecta_B249:0.0487563652,Atkinsonella_hypoxylon:0.0242213324):0.0469286595,Periglandula_ipomoeae_IasaF13:0.041368631):0.0093241203):0.0288413882,(Hypocrella_siamensis:0.0998958167,Moelleriella_libera_RCEF_2490:0.0989405297):0.0213834895):0.0157388659,(Pochonia_chlamydosporia_170:0.0439235972,Metarhizium_acridum:0.0538548521):0.0268946698)f_Clavicipitaceae:0.0411657121):0.0234963027,((Ophiocordyceps_australis:0.2161411022,Hirsutella_thompsonii_MTCC6686:0.0962581617):0.022484606,(Tolypocladium_geodes:0.0627756614,Purpureocillium_lilacinum:0.0806965237):0.0208613199):0.0280410659):0.0267804452,(Escovopsis_sp._TC:0.185621511,Trichoderma_cornu-damae:0.1143443314)f_Hypocreaceae:0.0627822458):0.0109815346,(((((Beauveria_australis:0.0436887805,Cordyceps_militaris:0.0670460901):0.0094034012,Akanthomyces_dipterigenus:0.0428631833):0.0129339321,(Aphanocladium_album:0.0007496684,Lecanicillium_aphanocladii:0.0011760247):0.0346539718):0.0279316323,Niveomyces_coronatus:0.1036427925)f_Cordycipitaceae_-2:0.1193787312,Calcarisporium_arbuscula:0.1367447783):0.0247178672):0.0187515877,(Stachybotrys_elegans:0.1362477477,Paramyrothecium_roridum:0.1063091158)f_Stachybotryaceae:0.0447015243):0.0146314865,\
((Trichothecium_ovalisporum:0.1718350707,Clonostachys_rosea_f._rosea_IK726:0.1624823188):0.0434241725,(Sarocladium_strictum:0.0361282033,Acremonium_sp._CBMAI_1973:0.0474428191):0.1484764383):0.0222215768):0.0142761616,(Stylonectria_norvegica:0.1158021042,(((((Neonectria_faginata:0.0199408078,Nectria_sp._B-13:0.025124283):0.0168789405,Corinectria_fuckeliana:0.041656098):0.0299253991,(Ilyonectria_robusta:0.0300688142,Dactylonectria_estremocensis:0.0458127041):0.0235523982):0.0287429089,(Thelonectria_rubi:0.1028443417,Calonectria_leucothoes:0.0784193788):0.0265484087):0.0231744045,Fusarium_virguliforme:0.1029535975):0.0231662834)f_Nectriaceae:0.0485168117)o_Hypocreales:0.0993196101):0.0207869427,(((((Plectosphaerella_plurivora:0.1004602204,Furcasterigmium_furcatum:0.0733005277):0.0835202174,Verticillium_klebahnii:0.1097647378):0.0233976823,Sodiomyces_alkalinus_F11:0.1511870481)f_Plectosphaerellaceae:0.0700137345,Colletotrichum_musae:0.1333933714):0.028090924,Reticulascus_tulasneorum:0.1560247546)o_Glomerellales:0.0522590701):0.0477136525):0.0240582469,(((((Daldinia_eschscholzii_UM1020:0.0269028203,Entonaema_liquescens:0.025825641):0.0345419851,(Annulohypoxylon_truncatum:0.0723843442,Hypomontagnella_submonticulosa:0.0515652887):0.0136146702):0.057986773,((((Astrocystis_sublimbata:0.0948750477,Amphirosellinia_nigrospora:0.0539041403):0.0227492185,((Rosellinia_necatrix:0.0866783278,(Nemania_diffusa:0.0036737647,Hypoxylon_argillaceum:0.0010410266):0.0625647561):0.0129711645,\
(Xylaria_grammica:0.056002054,Ustulina_deusta:0.0555314991):0.01771293):0.0103707778):0.029270198,Poronia_punctata:0.1078879349):0.0895136712,Biscogniauxia_mediterranea:0.1037125237):0.0314184269)f_Xylariaceae_-7:0.035539441,(Microdochium_trichocladiopsis:0.1748735277,(Hansfordia_pulvinata:0.1904355589,Monosporascus_sp._CRB-8-3:0.1266887743):0.0285447643):0.0231002889):0.0327430324,((Pseudomassariella_vexata:0.1459296262,((Apiospora_rasikravindrae:0.0317898383,Arthrinium_sp._KUC21332:0.0367178776)f_Apiosporaceae:0.1299042099,(Truncatella_angustata:0.0763184379,(Pseudopestalotiopsis_theae:0.0139357016,Neopestalotiopsis_rosae:0.0182188365):0.0598097823)f_Sporocadaceae:0.1002915822):0.0230684854):0.0191463513,Iodosphaeria_phyllophila:0.3106637194):0.0386289603)o_Xylariales:0.0911951815):0.0302606696,Zalerion_maritima:0.3831185755):0.1521205911,(((Antarctomyces_pellizariae:0.1982359955,Pseudogymnoascus_verrucosus:0.118649782):0.0957642715,Claussenomyces_sp._TS43310:0.1615661385):0.0419900679,((((((Lachnellula_hyalina:0.0793570887,Lachnum_nothofagi:0.1163353912)f_Lachnaceae:0.0465072769,((Glarea_lozoyensis_ATCC_20868:0.1060667525,Hymenoscyphus_infarciens:0.1062834893):0.0505781969,(Halenospora_varia:0.0679708439,Cudoniella_acicularis:0.0567356211)f_Tricladiaceae:0.0357865509):0.0149546235):0.0306366755,((((((Erysiphe_neolycopersici:0.0377599927,Oidium_heveae:0.0312623397):0.1165378757,Golovinomyces_cichoracearum:0.1432675521):0.0319723577,\
(Pleochaeta_shiraiana:0.1221429157,Phyllactinia_moricola:0.1758104573):0.0358232541):0.0525929466,Podosphaera_aphanis:0.1530442434):0.0181471915,Blumeria_hordei_K1:0.1872513754)f_Erysiphaceae:0.1293890739,(((((Neospermospora_avenae:0.0646743137,Leptodontidium_sp._MPI-SDFR-AT-0119:0.020414404):0.0072914815,Cadophora_sp._DSE1049:0.0263296578):0.0355341436,(Blumeriella_jaapii:0.085976673,(Marssonina_coronariae:0.0005865786,Diplocarpon_mali:0.0005045293):0.0651653894):0.029445799):0.0622217856,Phialocephala_sp._D728:0.1031508894):0.0152033624,(Cairneyella_variabilis:0.1019993929,(Stipitochalara_longipes_BDJ:0.0360337311,Hyaloscypha_hepaticicola:0.037688505):0.0592752887):0.0177821174):0.0086008966):0.0191891532):0.0149094359,(Bisporella_sp._PMI_857:0.2028946466,Gamarada_debralockiae:0.1014979999):0.022605762):0.0173319881,(((((Clarireedia_sp._CPB17:0.015311174,Rutstroemia_sp._NJR-2017a_BVV2:0.0113602961):0.0588985746,Lanzia_echinophila:0.0810472976):0.0123296603,Scleromitrula_shiraiana:0.0664892564):0.0196907733,(((Ciborinia_camelliae:0.0320390104,Monilinia_laxa:0.033481149):0.0053023468,Myriosclerotinia_curreyana:0.0334913084):0.0039219217,(Sclerotinia_subarctica:0.0288917533,(Botryotinia_globosa:0.0078024728,Botrytis_porri:0.009886906):0.0324130108):0.0111263137):0.0667358053)f_Sclerotiniaceae_-1:0.0697432502,Chlorencoelia_torta:0.1417013353):0.0331132479):0.0199659911,(Pseudofabraea_citricarpa:0.087862018,Pezicula_neosporulosa:0.1005801361):0.0549732504)o_Helotiales_-20:0.0505390031)c_Leotiomycetes:0.0409633008):0.1574438063,Trizodia_sp._TS-e1964:0.3354192516):0.0312283028):0.0381378636,\
((((Glutinoglossum_americanum:0.0638341023,Trichoglossum_hirsutum:0.0632730754):0.0229273551,Geoglossum_cookeanum:0.09921742):0.0221531741,Sabuloglossum_arenarium:0.074029337)o_Geoglossales:0.0417816025,Nothomitra_cinnamomea:0.1290673626)c_Geoglossomycetes:0.0921136915):0.2751339528,((((Ascodesmis_nigricans:0.293570706,Geopyxis_carbonaria:0.1880723378):0.0478660787,((Tricharina_praecox:0.1259115814,Sphaerosporella_brunnea:0.1277207994):0.0342102209,(Pyronema_domesticum:0.2120606503,(Wilcoxina_mikolae_CBS_423.85:0.0144889118,Trichophaea_hybrida:0.0235518328):0.0768149288):0.0354795286):0.0823127003)f_Pyronemataceae_-1:0.1204651538,(((Verpa_bohemica:0.0614324626,Morchella_snyderi:0.0804457103)f_Morchellaceae:0.1063889634,(Choiromyces_venosus_120613-1:0.03855458,Tuber_brumale:0.0516545546)f_Tuberaceae:0.1603744007):0.0543438751,Phymatotrichopsis_omnivora:0.1878976476):0.0361291947):0.1022000394,(Ascobolus_immersus_RN42:0.5393831145,(((Tirmania_nivea:0.0456521844,Terfezia_boudieri_ATCC_MYA-4762:0.0426621451):0.1343540636,Kalaharituber_pfeilii:0.1332081513):0.0472191912,Peziza_echinospora:0.1858488716)f_Pezizaceae:0.1735976507):0.0543259316)c_Pezizomycetes:0.0719794033):0.0528896197,((Drechslerella_brochopaga:0.1278571324,((Arthrobotrys_flagrans:0.0246555814,Orbilia_oligospora:0.026342998):0.0872227151,Dactylellina_haptotyla_CBS_200.50:0.0918229876):0.0254140322):0.0415086233,Dactylella_cylindrospora:0.1023368981)c_Orbiliomycetes:0.379241447):0.2266963):0.1195488117):0.2466846452,((((((Austropuccinia_psidii:0.1791802456,(Uromyces_viciae-fabae:0.1524147357,Puccinia_graminis_f._sp._tritici:0.0997740686)\
f_Pucciniaceae:0.0813044329):0.0498050959,Phakopsora_pachyrhizi:0.230853533):0.0684452508,(Melampsora_larici-populina_98AG31:0.1281068943,Cronartium_quercuum_f._sp._fusiforme_G11:0.126075179):0.1050982947):0.2698013159,Hemileia_vastatrix:0.4413380574)c_Pucciniomycetes:0.2238450873,((Atractiella_rhizophila:0.7400296741,(((Rhodotorula_toruloides:0.1491092038,Rhodosporidiobolus_sp._SP3-4:0.151625616):0.0561218396,Sporobolomyces_pararoseus:0.1832122584)o_Sporidiobolales:0.1237485877,((Microbotryum_silenes-acaulis:0.2543320917,Leucosporidium_yakuticum:0.1296190922):0.0396112876,(Pseudohyphozyma_bogoriensis:0.2296389953,Glaciozyma_antarctica_PI12:0.1713719328):0.0414498218):0.0531496361)c_Microbotryomycetes:0.2340755305):0.0619278517,((Erythrobasidium_hasegawianum:0.1921482292,(Cystobasidium_sp._KV-2022a:0.2331408946,Symmetrospora_coprosmae:0.199180699):0.0483704168)c_Cystobasidiomycetes:0.2987610119,(Cystobasidiopsis_lactophilus:0.5498175026,Mixia_osmundae_IAM_14324:0.4847456774):0.0734589301):0.0609899507):0.0686320587):0.1007649032,((((((((((((((Chroogomphus_rutilus:0.025666993,Gomphus_bonarii:0.0255945069):0.0576936727,Gautieria_morchelliformis:0.0774011831):0.0127692126,Cantharellus_purpuraceus:0.0765048164):0.0358002733,Ramaria_rubella:0.0906368177):0.0449259864,((Sphaerobolus_stellatus_SS14:0.2146875576,(Dictyophora_indusiata:0.1240643077,Clathrus_columnatus:0.0974538998)o_Phallales:0.1423752712):0.0309580313,Hysterangium_stoloniferum:0.1344896805):0.0313935906):0.1780554474,Sistotremastrum_suecicum_HHB10207_ss-3:0.3555216863):0.0304782788,(((((((((((((Tricholoma_bakamatsutake:0.1529617052,\
(Clitocybe_nebularis:0.0767007842,(Leucocalocybe_mongolica:0.0292435493,Lepista_nuda:0.0386267381):0.0641743971):0.0254509707):0.0146407775,(((((((Termitomyces_titanicus:0.0676848071,Arthromyces_matolae:0.1149557729):0.0354684964,(Tephrocybe_rancida:0.0510280215,Blastosporella_zonata:0.0590985187):0.0171700995):0.0410858583,Myochromella_boudieri:0.1096033874):0.01359477,Rugosomyces_carneus:0.1820093944):0.0099676808,(Lyophyllum_semitale:0.0765250823,((Tricholomella_constricta:0.0437902669,Asterophora_lycoperdoides:0.0745404329):0.0181095867,Sphagnurus_paluster:0.0834476291):0.0128100172):0.0099644003):0.0345024159,Hypsizygus_ulmarius:0.0953884423):0.0104178551,(Entoloma_clypeatum:0.1213682625,Clitopilus_passeckerianus:0.2119806897)f_Entolomataceae:0.0364044816):0.0313085406):0.0232602538,(Macrocybe_gigantea:0.0153281295,Calocybe_indica:0.0158594503):0.1715329488):0.0303439866,((((Cyathus_striatus:0.1616058322,Crucibulum_laeve:0.1069264791)f_Nidulariaceae:0.0345095397,(((((Tulosesus_angulatus:0.0856578781,Coprinellus_micaceus:0.1142507126):0.0367711237,Candolleomyces_aberdarensis:0.0920126581):0.0645373337,Coprinopsis_marcescibilis:0.1807180044)f_Psathyrellaceae:0.1085185434,Laccaria_amethystina_LaAM-08-1:0.1316514818):0.0192897987,(((((Flammula_alnicola:0.0585636498,((Stropharia_rugosoannulata:0.0847987917,Hypholoma_fasciculare:0.0770937877):0.0393403172,Pholiota_conissans:0.0830314383):0.0353969362):0.0264675099,Hebeloma_cylindrosporum_h7:0.1007864324):0.0134175842,((Galerina_marginata:0.07784858,Gymnopilus_dilepis:0.1205706459):0.017531282,Psilocybe_mexicana:0.1198832993):0.0168663064):0.0221873104,\
(((Inosperma_sp._D86:0.1627864662,Crepidotus_variabilis:0.1566998148):0.0593068176,(Agrocybe_cylindracea:0.019869756,Cyclocybe_aegerita:0.0192725282):0.0845248272):0.0215578213,Panaeolus_papilionaceus:0.1902246745):0.016035327)f_Strophariaceae_-3:0.0228887105,Crassisporium_funariophilum:0.1029715712):0.0559940241):0.0202501125):0.0107670159,(((((((Leucoagaricus_leucothites:0.0582709817,Leucocoprinus_sp._KB1807203:0.153205663):0.0470440113,Agaricus_sinodeliciosus:0.1514818161):0.0175622407,(Macrolepiota_fuliginosa_MF-IS2:0.0716677306,Podaxis_carcinomalis:0.0492880203):0.0118237763):0.0069041221,Calvatia_gigantea:0.0952644402):0.0289592435,Lepiota_subincarnata:0.1058850405):0.0224374197,Coprinus_comatus:0.1408570336)f_Agaricaceae_-2:0.1241436906,Floccularia_luteovirens:0.1720211046):0.0208162212):0.0218831965,Amanita_inopinata_Kibby_2008:0.2333366639):0.018454925):0.0113815566,((Infundibulicybe_gibba:0.0315566326,Collybia_sp._MG36:0.0351801496):0.1278724794,((Pluteus_cervinus:0.1680155299,Volvariella_volvacea_PYd21:0.1775617644)f_Pluteaceae:0.0674929055,Macrocystidia_cucumis:0.1812586792):0.0234058154):0.014529659):0.0238978606,(((((((Neonothopanus_nambi:0.0415885099,Omphalotus_olearius_VT_653.13:0.0586752206):0.0509808231,(((Rhodocollybia_butyracea:0.0947557583,Gymnopus_androsaceus_JB14:0.0895540418):0.0111887161,Lentinula_aff._lateritia:0.0997488004):0.012566529,Collybiopsis_luxurians_FD-317_M1:0.0875064817):0.1073840367)f_Omphalotaceae:0.0334000399,Tetrapyrgos_nigripes:0.1836788156):0.0217133379,(Moniliophthora_roreri:0.1066421082,Marasmius_fiardii_PR-910:0.140665042):0.0832044193):0.0615431426,\
((((Hymenopellis_radicata:0.0229017778,Mucidula_mucida:0.028932635):0.0666937358,Strobilurus_luchuensis:0.0899260974):0.0441750217,(Flammulina_velutipes:0.1099258441,Cylindrobasidium_torrendii_FP15055_ss-10:0.2530220867):0.0501872631):0.0838513101,((Armillaria_nabsnona:0.0233014672,Desarmillaria_ectypa:0.029159815):0.0101113139,Guyanagaster_necrorhizus_MCA_3950:0.0374451954):0.1061985302)f_Physalacriaceae:0.0817787557):0.0179637771,((Megacollybia_marginata:0.2371559985,(Chondrostereum_purpureum:0.1230254341,Gloeostereum_incarnatum:0.0920780456):0.106306155):0.0202538234,Baeospora_myosura:0.1534044721)f_Cyphellaceae_-1:0.0288310586):0.0366504411,((Flagelloscypha_sp._PMI_526:0.4051753109,((Schizophyllum_commune:0.0679144251,Auriculariopsis_ampla:0.0725303964)f_Schizophyllaceae:0.1868926203,Fistulina_hepatica_ATCC_64428:0.2987331585):0.0540874855):0.0465790649,(Mycena_kentingensis__nom._inval._:0.1851007961,Panellus_pusillus:0.1262660275):0.1039813243):0.0197021737):0.0155975693):0.02387491,((Amauroderma_rugosum:0.0040460411,Pleurotus_floridanus:0.0057752231):0.2055582129,Pterula_gracilis:0.3552297485):0.0397012065):0.0274766748,(Hygrophorus_pudorinus:0.1410011107,(Hygrocybe_conica:0.2194165601,Porpolomopsis_calyptriformis:0.1685985794):0.0399254621)f_Hygrophoraceae:0.0330161773):0.0224509693,(((((Suillus_subluteus:0.0621500311,Rhizopogon_roseolus:0.068092939):0.0938143435,((Pisolithus_thermaeus:0.1082260499,(Scleroderma_citrinum_Foug_A:0.1048810855,Astraeus_odoratus:0.0861514184):0.015204675):0.0781698223,((((((Boletus_edulis:0.0722346606,(Tylopilus_plumbeoviolaceoides:0.0795828868,Imleria_badia:0.0413290504):0.0080562543):0.0096367833,\
(Lanmaoa_asiatica:0.042020958,((Pulveroboletus_ravenelii:0.0678741594,Neoboletus_magnificus:0.042744877):0.0083773813,((Butyriboletus_roseoflavus:0.0023179938,Retiboletus_ornatipes:0.000990268):0.0287733464,Caloboletus_calopus:0.0356098206):0.0222596137):0.0042934793):0.008316635):0.0053159931,Xerocomus_impolitus:0.0702618942):0.0097775508,Chiua_virens:0.0793625279)f_Boletaceae:0.0583129518,(Paxillus_rubicundulus_Ve08.2h10:0.0743557464,Melanogaster_broomeanus:0.069762026):0.0182192732):0.0439336823,Phlebopus_sp._FC_14:0.115964255):0.0190765623):0.0509885884):0.0293625487,(Hygrophoropsis_aurantiaca:0.0808252819,Leucogyrophana_mollusca:0.0460497532):0.0654841998):0.0309648239,Coniophora_puteana_RWD-64-598_SS2:0.2418969141):0.0716740134,(Fibularhizoctonia_sp._CBS_109695:0.1650287868,Piloderma_croceum_F_1598:0.1135752316):0.082788797):0.0209761621):0.0192449034,Athelia_rolfsii:0.3176284959)o_Atheliales_-1:0.0295855671,(((((((((Postia_placenta_Mad-698-R:0.1144357685,Fibroporia_radiculosa:0.1237122835):0.0179334092,(((Neoantrodia_serialis:0.0571934087,Rhodofomes_roseus:0.056700041):0.0149223635,(Fomitopsis_palustris:0.069720503,Daedalea_quercina_L-15889:0.0559561698):0.0115441831):0.0926676199,Laetiporus_sulphureus:0.1436454322):0.0178101215):0.0265725758,(Antrodia_cinnamomea:0.0006032581,Taiwanofungus_camphoratus:0.0004797066):0.1065811487)f_Fomitopsidaceae_-1:0.017743931,(Sparassis_crispa:0.1399918988,Amylocystis_lapponica:0.1248524279):0.0199851151):0.0226466313,Obba_rivulosa:0.1555802724):0.0190803298,(((((Ganoderma_leucocontextum:0.070416003,Dichomitus_squalens_LYAD-421_SS1:0.0560594595):0.0387902868,\
(Epithele_typhae:0.1420564873,(Porogramme_epimiltina:0.0597762476,Grammothele_lineata:0.0653903167):0.0183177085):0.0370017334):0.0088070259,(((Cerioporus_squamosus:0.0207560592,Polyporus_arcularius_HHB13444:0.0276298718):0.0481263934,Coriolopsis_trogii:0.0686339669):0.0095819583,((Daedaleopsis_nitida:0.0695839265,Lignosus_rhinocerotis_TM02:0.0680495479):0.0137001438,Fomes_fomentarius:0.0706235525):0.0148858658):0.0150669256):0.0270680623,((Trametes_pubescens:0.0626912544,Lenzites_betulinus:0.0628410281):0.0353726509,Cubamyces_sp._BRFM_1775:0.0533191584):0.0330182447):0.0852329894,Grifola_frondosa:0.1140852246):0.0331850526):0.0276692707,(((((Cytidiella_melzeri:0.0784967651,Irpex_lacteus:0.086033809):0.0257715677,Trametopsis_cervina:0.091101651)f_Irpicaceae:0.0843786945,(Terana_caerulea:0.1183396754,((Phanerochaete_carnosa_HHB-10118-sp:0.0692830585,Phanerodontia_chrysosporium:0.0458015708):0.0572027157,Phlebiopsis_gigantea_11061_1_CR5-6:0.1196978025):0.0232919149)f_Phanerochaetaceae:0.0479944455):0.0230925261,(Ceriporiopsis_andreanae_CBS_279.92:0.1692455929,Hermanssonia_centrifuga:0.1109889269)f_Meruliaceae:0.0305098511):0.0567290941,((Physisporinus_lineatus:0.1620472553,Abortiporus_biennis:0.151231729):0.0277480504,((Lentinus_polychrous:0.038808887,Panus_rudis_PR-1116_ss-1:0.0344259686):0.1289897615,((Steccherinum_ochraceum:0.0915796973,Antrodiella_citrinella:0.0885536869)f_Steccherinaceae:0.0181825229,Cristinia_sonorae:0.0716763488):0.1032498049):0.0173250702):0.0280335265):0.0293394682):0.0548008924,(Thelephora_ganbajun:0.2162507529,Sarcodon_sp._MG97:0.1472808241)o_Thelephorales:0.1274292762):0.0256211191,\
((Jaapia_argillacea_MUCL_33604:0.1617603822,(Gloeophyllum_trabeum_ATCC_11539:0.0663903774,(Neolentinus_lepideus_HHB14362_ss-1:0.0560075913,Heliocybe_sulcata:0.066214041):0.0426217691)o_Gloeophyllales:0.1051018609):0.0569665021,(Limonomyces_culmigenus:0.362683097,Punctularia_strigosozonata_HHB-11173_SS5:0.2177547657)o_Corticiales:0.0666774263):0.0255308586):0.0151724711):0.0161370722,(((Albatrellus_ellisii:0.1892720705,(Bondarzewia_mesenterica:0.0957342409,Heterobasidion_irregulare_TC_32-1:0.106077409)f_Bondarzewiaceae:0.0522705285):0.0127316355,(Hericium_erinaceus:0.1266662193,Dentipellis_sp._KUC8613:0.1063883271)f_Hericiaceae:0.0650202249):0.013039297,((((Lactarius_indigo:0.0832257572,(Multifurca_ochricompacta:0.0823458883,(Lactifluus_subvellereus:0.054937257,Russula_dissimulans:0.0934696895):0.0111446333):0.0109504874)f_Russulaceae:0.0379256267,Gloeopeniophorella_convolvens:0.0883282091):0.111442067,(Auriscalpium_orientale:0.1211719876,Artomyces_pyxidatus:0.0993257806)f_Auriscalpiaceae:0.0372009881):0.027901334,(Amylostereum_areolatum:0.1333893252,(Peniophora_sp._CBMAI_1063:0.2159576294,Vararia_minispora_EC-137:0.1655194011):0.1034922635):0.0645159284):0.0231393314)o_Russulales:0.0868208485):0.065779345,(((((((Fomitiporia_mediterranea_MF3/22:0.093911056,(Inonotus_obliquus:0.0924767352,Sanghuangporus_sanghuang:0.0770776981):0.0556982362):0.0305622763,Porodaedalea_pini:0.0613433005):0.0394427331,((Pyrrhoderma_noxium:0.0681704057,Phellinus_lamaoensis:0.0671664869):0.1110019924,Hymenochaete_sp._R1:0.236543899):0.0251507825):0.0272104156,(Phellopilus_nigrolimitatus:0.1106648061,\
(Coniferiporia_sulphurascens:0.072017009,Phellinidium_pouzarii:0.1024464144):0.0302237517):0.0230563601)f_Hymenochaetaceae:0.0463798245,Trichaptum_abietinum:0.1702511658):0.0465688431,Schizopora_paradoxa:0.2615915393):0.0600015207,Rickenella_mellea:0.2008951217)o_Hymenochaetales:0.0664940305):0.0593622034):0.0352572877,(Exidia_glandulosa_HHB12029:0.1369165087,Auricularia_auricula-judae:0.1270651525)o_Auriculariales:0.32480615):0.0329455337,Serendipita_vermifera_MAFF_305830:0.5533730067):0.0448682502,(((Ceratobasidium_sp._AG-Ba:0.0978520769,Rhizoctonia_solani:0.1132825187)f_Ceratobasidiaceae:0.3121363801,Tulasnella_calospora_MUT_4182:0.3960199516):0.0384399053,((Hydnum_rufescens_UP504:0.212225949,Clavulina_sp._PMI_390:0.306042807)f_Hydnaceae:0.167057577,Botryobasidium_botryosum_FD-172_SS1:0.2778834261):0.0499981865):0.0304625257)c_Agaricomycetes_-155:0.0718531734,(Calocera_cornea_HHB12733:0.0919241589,Dacryopinax_primogenitus:0.1206589095)c_Dacrymycetes:0.4033900215):0.106564976,((((((((Saitozyma_podzolica:0.1431666728,Dioszegia_hungarica:0.2622457157):0.0495941758,(Tremella_mesenterica_DSM_1558:0.2988600523,(Naematelia_aurantialba:0.1992753769,((Bullera_alba:0.1797144267,Papiliotrema_laurentii:0.1680788476):0.037463354,Kockovaella_imperatae:0.2567236553):0.0395226552):0.0262189517):0.0160117901):0.0182108157,(Cryptococcus_neoformans:0.1719691189,Kwoniella_heveanensis_BCC8398:0.1262444332)\
f_Cryptococcaceae:0.0813659704):0.0311759374,(((((Apiotrichum_sp._Y4204:0.1066431066,Cutaneotrichosporon_cutaneum:0.0732537589):0.0862272012,(Trichosporon_ovoides:0.2330450237,Pascua_guehoae:0.1432833901):0.0260752348):0.0201711388,Prillingera_fragicola:0.1487523669):0.0240021276,Vanrija_humicola:0.1657670453)f_Trichosporonaceae:0.1019348359,Takashimella_tepidaria:0.1969655876):0.074965463):0.0383997549,Phaeotremella_skinneri:0.1671393151)o_Tremellales_-1:0.1401024958,(Holtermannia_corniformis:0.0980867018,Holtermanniella_nyarrowii:0.1154299515)o_Holtermanniales:0.174342679):0.1266163664,(((Filobasidium_floriforme:0.3059968067,Naganishia_vaughanmartiniae:0.2889457888):0.0557983525,Goffeauzyma_gilvescens:0.3140276082)f_Filobasidiaceae:0.0592379678,Solicoccozyma_phenolica:0.2555642172)o_Filobasidiales:0.1245411345):0.2039847439,(((Mrakia_blollopis:0.180958211,Tausonia_pullulans:0.2072959398):0.0543669559,(Cystofilobasidium_capitatum:0.3003069916,Phaffia_rhodozyma:0.2224199025):0.073559003):0.133275245,Krasilnikovozyma_curviuscula:0.4069033506)o_Cystofilobasidiales:0.1798484417)c_Tremellomycetes:0.1206239648):0.0611712234,(Basidioascus_undulatus:0.2147075458,Wallemia_mellicola:0.5746134768):0.2632212959):0.0654913564,(((((Moniliella_sp.__wahieum_:0.5650102966,Tilletiaria_anomala_UBC_951:0.195922233):0.1728343342,(Tilletia_walkeri:0.0939945661,Salmacisia_buchloeana:0.0898449444)o_Tilletiales:0.3381501074):0.0506997868,((((Quambalaria_eucalypti:0.1403655546,Pseudomicrostroma_glucosiphilum:0.1595733076):0.0436390429,Jaminaea_rosea:0.2061026473)o_Microstromatales:0.2673972318,\
((Ceraceosorus_guamensis:0.2669114515,Tilletiopsis_washingtonensis:0.1954039399):0.1612622947,(Acaromyces_ingoldii:0.1946440489,(Exobasidium_cylindrosporum:0.1822352462,Meira_miltonrushii:0.2208405367):0.0950822934)o_Exobasidiales:0.1178959766):0.050232865):0.0402844552,Golubevia_sp._BC0850:0.406107678):0.0295939102)c_Exobasidiomycetes_-3:0.0288078527,((Violaceomyces_palustris:0.1577700075,((Ustanciosporium_gigantosporum:0.0883798498,(((((((Ustilago_maydis:0.0466399719,Pseudozyma_sp._F8B2:0.0419347434):0.0065564155,Macalpinomyces_mackinlayi:0.0376463915):0.0149098964,(Sporisorium_graminicola:0.0382851311,Anthracocystis_walkeri:0.0364315197):0.0101424479):0.0085988837,Kalmanozyma_brasiliensis_GHG001:0.0660379858):0.0245231872,Moesziomyces_sp._F16C1:0.0680117802):0.0553612315,Tranzscheliella_williamsii:0.108899587):0.0184819163,(Testicularia_cyperi:0.0966775459,Farysia_itapuensis:0.1284694442):0.0178460972)f_Ustilaginaceae_-1:0.0150152385)o_Ustilaginales:0.1175514343,Thecaphora_thlaspeos:0.1701601267):0.0620010306)c_Ustilaginomycetes:0.0864880007,Malassezia_japonica:0.5331389375):0.0467539052):0.2044762683,Peribolospora_baueri:0.3467597711):0.1316135726):0.040155866):0.2578739516):0.1861674802,(((((((Gigaspora_margarita:0.0460498931,Dentiscutata_erythropus:0.0494471427):0.0262161984,(Cetraspora_pellucida:0.0413536146,Racocetra_fulgida:0.0366376545):0.029885612)f_Gigasporaceae:0.1415338445,(Acaulospora_colombiana:0.2303189846,Diversispora_epigaea:0.1870181391):0.0608646705)o_Diversisporales:0.0516355688,((Glomus_cerebriforme:0.0616619604,(Oehlia_diaphana:0.0005636778,Rhizophagus_sp._MUCL_43196:0.0001291189):0.0838263876):0.0475433475,Funneliformis_caledonium:0.1292201408)o_Glomerales:0.1254894339):0.0265071675,Entrophospora_candida:0.3393474794):0.0756826991,((Geosiphon_pyriformis:0.2027771588,Ambispora_gerdemannii:0.2004351654)o_Archaeosporales:0.1147796008,Paraglomus_brasilianum:0.3929820561):0.0338445735)c_Glomeromycetes:0.2176913921,\
(((Endogone_sp._FLAS-F59071:0.2962005537,Bifiguratus_adelaidae:0.393319775)c_Endogonomycetes:0.0378900972,(((((((((Rhizopus_microsporus_B9738:0.0928262253,Sporodiniella_umbellata:0.2460939171)f_Rhizopodaceae:0.0470424257,((((Parasitella_parasitica:0.0909364793,Mucor_lusitanicus:0.045455566):0.0411644321,Actinomucor_elegans:0.0950155487):0.0151743971,(((Blakeslea_trispora:0.0365432313,Choanephora_cucurbitarum:0.0404788493):0.0640312882,Gilbertella_persicaria:0.0748090698)f_Choanephoraceae:0.0677914517,((Benjaminiella_poitrasii:0.0672249765,Cokeromyces_recurvatus_B5483:0.0689356126):0.0596049953,Mycotypha_africana:0.1982935332):0.0358063878):0.0248572212):0.0156166631,(Pilaira_anomala:0.0577219317,(Thamnidium_elegans:0.0313049015,Helicostylum_pulchrum:0.0307450222):0.0367128057):0.0857397701):0.0253794651):0.03545454,Pilobolus_umbonatus:0.2076831526):0.0315431217,Backusella_mclennaniae:0.1810577505):0.1253313543,((((Absidia_repens:0.0700659157,Chlamydoabsidia_padenii:0.0740430044):0.0323289417,Halteromyces_radiatus:0.071616062):0.0597612702,Cunninghamella_bertholletiae_175:0.1474123221):0.0250317128,(Gongronella_sp._w5:0.1330557382,Hesseltinella_vesiculosa:0.1275995953):0.127070255)f_Cunninghamellaceae:0.1221451428):0.0253619183,Radiomyces_spectabilis:0.1941208879):0.0138574675,((Phycomyces_blakesleeanus_NRRL_1555_-_:0.1051707323,Spinellus_fusiger:0.1760390111):0.1243899297,(Saksenaea_oblongispora_B3353:0.0817833979,Apophysomyces_ossiformis:0.0917051898):0.0908992455):0.0235548493):0.0282001373,((((((Circinella_umbellata:0.0640943386,Phascolomyces_articulosus:0.0459973234):0.0336478639,Zychaea_mexicana:0.0635611285):0.027774989,Fennellomyces_sp._T-0311:0.0877222612):0.0742085323,\
(Dichotomocladium_elegans:0.1571032804,Lichtheimia_ornata:0.1303836366):0.0612429752):0.0338760957,(Thermomucor_indicae-seudaticae:0.1426018685,Rhizomucor_miehei_CAU432:0.1606217701):0.0274405323)f_Lichtheimiaceae:0.023265267,Syncephalastrum_sp._PYS2702:0.2402566858):0.0542013509)c_Mucoromycetes_-12:0.1593326021,Umbelopsis_vinacea:0.2857013399):0.12984335):0.1238638278,(((((((Linnemannia_zychae:0.0344549528,Haplosporangium_gracile:0.0324906721):0.0615032747,Mortierella_alpina:0.075339057):0.0100699084,(((Modicella_reniformis:0.1392042038,Lobosporangium_transversale:0.0956293687):0.0147647228,Gamsiella_multidivaricata:0.0632566878):0.0136860277,Dissophora_ornata:0.0672653861):0.0259037453):0.0139318999,(Gryganskiella_cystojenkinii:0.058347431,Entomortierella_parvispora:0.0437146685):0.0606714549):0.0165304604,Podila_verticillata:0.0972324111):0.0350667707,Lunasporangiospora_selenospora:0.1521210852):0.0821245862,Actinomortierella_ambigua:0.1808931983)c_Mortierellomycetes:0.36862878):0.0418108817):0.0664227928):0.0426882609,(((((((Massospora_cicadina:0.1857521139,Entomophthora_muscae:0.1315218413):0.282425098,Neoconidiobolus_thromboides_FSU_785:0.5016476321):0.061397379,Capillidium_heterosporum:0.5263397878):0.2278206635,Conidiobolus_incongruus_B7586:0.5914709962)c_Entomophthoromycetes:0.2656636749,((Dispira_simplex:0.3152242501,Dimargaris_cristalligena:0.3122893935)c_Dimargaritomycetes:0.3504365727,((((Zancudomyces_culisetae:0.5294366876,Capniomyces_stellatus:0.2381417396):0.1615967192,(Furculomyces_boomerangus:0.0001914797,Smittium_angustum:0.0004297643):0.4340678997)c_Harpellomycetes:0.3624808735,(Linderina_pennispora:0.1851132343,((Kickxella_alabastrina:0.2171237578,Coemansia_sp._RSA_1646:0.2242798892):0.0784938831,Martensiomyces_pterosporus:0.1071396614):0.0570496498)\
c_Kickxellomycetes:0.3693837876):0.2107338125,Ramicandelaber_brevisporus:0.9761892354):0.0895951016):0.1089883146):0.0518790085,Basidiobolus_meristosporus_B9252:0.4549665436):0.0460713455,(((((Stylopage_hadra:0.5409348285,Zoophagus_insidians:0.6069818302):0.1265320434,Acaulopage_tetraceros:0.5604811218):0.1498946425,(Cochlonema_odontosperma:0.5555099809,Zoopage_sp._CT-All:0.7550063481):0.0764878337)f_Zoopagaceae_-1:0.0943259149,Piptocephalis_tieghemiana:0.770006979):0.0860565791,(Syncephalis_plumigaleata:0.2581637618,Thamnocephalis_sphaerospora:0.2126025636):0.3264502741)c_Zoopagomycetes:0.1389673458):0.0451978373):0.1004760327,((((Neocallimastix_sp._JGI-2020a:0.0817528705,Anaeromyces_robustus:0.0641922051):0.0147513951,(Caecomyces_sp.:0.0813211722,Piromyces_finnis:0.0704691831):0.0162136165)c_Neocallimastigomycetes:0.6512082223,(Gonapodya_prolifera_JEL478:0.5821807418,Hyaloraphidium_curvatum:0.5306669018)c_Monoblepharidomycetes:0.1823060425):0.0576316824,(((((((Zopfochytrium_polystomum:0.3894839152,Blyttiomyces_sp._JEL0837:0.3015830719):0.060274789,((((Rhizoclosmatium_globosum:0.1375871562,Obelidium_mucronatum:0.1151239066):0.0246988475,Podochytrium_sp._JEL0797:0.1694951031):0.0519035951,Physocladia_obscura:0.2461621495):0.0486931595,Chytriomyces_cf._hyalinus_JEL632:0.1839417167):0.2849745803):0.0579922244,(Chytridium_lagenaria:0.349330072,Irineochytrium_annulatum:0.3189565861):0.1221809918):0.1478498676,Caulochytrium_protostelioides:1.059289904):0.0473439401,(((((Batrachochytrium_salamandrivorans:0.2835947419,Homolaphlyctis_polyrhiza_JEL_142:0.2742933649):0.040372539,Polyrhizophydium_stewartii:0.2281152913):0.0520870751,Entophlyctis_helioformis:0.2597810224):0.1356640049,((Globomyces_pollinis-pini:0.3489300478,(Boothiomyces_macroporosus:0.0684836725,Terramyces_sp._JEL0728:0.0672752623)f_Terramycetaceae:0.2903521305):0.1844290756,Gorgonomyces_haynaldii:0.5633373815):0.1181237797)o_Rhizophydiales_-3:0.1565233304,((Rhizophlyctis_rosea:0.2757679493,Borealophlyctis_nickersoniae:0.2110230399)o_Rhizophlyctidales:0.1090942448,\
(((Phlyctochytrium_arcticum:0.3005206416,Spizellomyces_sp.__palustris_:0.129510681):0.0468722925,(Fimicolochytrium_jonesii:0.233381759,((Powellomyces_hirtus:0.1018152484,Geranomyces_variabilis:0.1579729931):0.0437883792,Thoreauomyces_humboldtii:0.2012855098):0.0637811269)f_Powellomycetaceae:0.0826452153):0.0474498324,Gaertneriomyces_sp._JEL0708:0.3369192234)o_Spizellomycetales_-1:0.1086803638):0.0789114208):0.0491785159):0.0357293831,(Polychytrium_aggregatum:0.5072853481,(Quaeritorhiza_haematococci:0.2986837341,(Lobulomyces_angularis:0.0031947911,Clydaea_vesicula:0.0061155667)o_Lobulomycetales:0.7184025562):0.0794910485):0.0369367906):0.0289167364,(Cladochytrium_replicatum:0.5597388234,Synchytrium_microbalum:0.5582606911):0.0597374479)c_Chytridiomycetes_-22:0.1055253847):0.1181524503):0.080405268,(((Catenaria_anguillulae_PL171:0.3204753257,Blastocladiella_emersonii_ATCC_22665:0.2412487356):0.1522080169,Allomyces_arbusculus:0.309990647)c_Blastocladiomycetes:0.4222362134,Paraphysoderma_sedebokerense:0.4464279828):0.169963477):0,Paramicrosporidium_saccamoebae:1.510083103);
`;

var plant_string =
`((((((((((((((((((((((((((((((((((((Cajanus_cajan:0.0885680307,Mucuna_pruriens:0.0688761598):0.0059710612,((Macrotyloma_uniflorum:0.0516819342,(Lablab_purpureus:0.0421262075,(Vigna_reflexopilosa:0.0565839541,Phaseolus_lunatus:0.0430306868):0.009867636):0.0154036021):0.0423217991,((Pueraria_montana_var._thomsonii:0.0337138411,(Glycine_soja:0.0505954639,Amphicarpaea_edgeworthii:0.0698431827):0.0098560213):0.0104288839,Pachyrhizus_erosus:0.0563995997):0.0104059583):0.0108736815):0.0077815818,Spatholobus_suberectus:0.0478972153):0.0376775587,(Canavalia_ensiformis:0.0833028799,Abrus_pulchellus_subsp._cantoniensis:0.0847145826):0.0119643965):0.0335980076,((Glycyrrhiza_uralensis:0.0720887493,(Oxytropis_ochrocephala:0.1283031275,((((Lathyrus_tuberosus:0.0326405994,Pisum_sativum:0.0303186988):0.0106580986,Vicia_sativa:0.0534586938):0.063279608,(Trifolium_pratense:0.0755549615,Medicago_truncatula:0.0834875496):0.0147507906):0.0323946139,Cicer_reticulatum:0.0819809279):0.0468388329):0.0283402517):0.0264848099,\
(Sesbania_bispinosa:0.0885738199,Lotus_japonicus:0.1658445874):0.0104313483):0.0210235066):0.0267683546,((Lupinus_albus:0.1780849045,Ormosia_semicastrata:0.0578277565):0.0110927031,((Arachis_ipaensis:0.1485053443,Aeschynomene_evenia:0.1062452776):0.0169239298,Nissolia_schottii:0.1047875627):0.0531072023):0.0054103207):0.0280537657,Styphnolobium_japonicum:0.0663200089):0.0188718488,Castanospermum_australe:0.0750439565):0.0562826952,((((Acacia_melanoxylon:0.0681881994,Mimosa_pudica:0.1425768686):0.0096410251,Vachellia_pachyceras:0.0770666081):0.0083676618,Prosopis_alba:0.0647199467):0.0954494711,(Senna_tora:0.0966828148,Chamaecrista_fasciculata:0.1197488787):0.0237889403):0.0611458682):0.0184956325,Sindora_glabra:0.1939280753):0.0107111601,(Cercis_canadensis:0.0422323794,Bauhinia_variegata:0.0934538939):0.0872201739)o_Fabales:0.1857578385,((((((Pterocarya_stenoptera:0.0216236033,Cyclocarya_paliurus:0.0162603598):0.0032025344,Juglans_regia:0.0199039664):0.0087113436,Carya_illinoinensis:0.0268927897)f_Juglandaceae:0.107783179,Morella_rubra:0.1583022256):0.0189527311,(((Corylus_avellana:0.0222116268,Carpinus_viminea:0.032217586):0.0366861434,(Betula_pendula:0.0510693417,Alnus_glutinosa:0.0678134786):0.006149084)\
f_Betulaceae:0.0391396378,Casuarina_cunninghamiana:0.1496454275):0.0384292228):0.0227826026,(Fagus_sylvatica:0.0876310077,((Quercus_gilva:0.0153976052,Notholithocarpus_densiflorus:0.0152930823):0.0042461806,Castanea_crenata:0.0266975357):0.0803608157)f_Fagaceae:0.0560272482)o_Fagales:0.0717446205):0.0156538565,((((((((((Pyrus_x_bretschneideri:0.0264489575,Malus_sieversii:0.0222324309):0.003133113,Heteromeles_arbutifolia:0.0237501476):0.0030833994,Pyracantha_coccinea:0.0331396509):0.0040505987,Aronia_arbutifolia:0.0355663341):0.0267174139,Gillenia_trifoliata:0.0385656361):0.0787532283,Prunus_mongolica:0.0821321729):0.0483859569,(((Rosa_chinensis:0.0424417352,(Fragaria_x_ananassa:0.0573359025,Potentilla_anserina:0.0871841258):0.018468624):0.0321894789,Geum_urbanum:0.1450902343):0.0178160045,Rubus_parviflorus:0.0435228506):0.1123008136):0.0138218027,(Purshia_tridentata:0.0398125907,Dryas_drummondii:0.0275710627):0.0689351579)f_Rosaceae:0.1231511819,((Elaeagnus_macrophylla:0.2934290534,((((Humulus_lupulus:0.0433459542,Cannabis_sativa:0.0672869708):0.1136841958,(Parasponia_andersonii:0.0332541953,Trema_orientale:0.0193252236):0.0734539013)f_Cannabaceae:0.0563929628,(Boehmeria_nivea:0.2226484134,\
((Morus_alba:0.0803808684,Artocarpus_heterophyllus:0.0890036713):0.0165735087,Ficus_erecta:0.0997248924)f_Moraceae:0.0568127671):0.0282549643):0.0362218816,Ulmus_americana:0.19924018):0.0445233128):0.0112715653,((Ochetophila_trinervis:0.0748651904,Ziziphus_jujuba:0.0732388527):0.066078156,Rhamnella_rubrinervis:0.1289454685)f_Rhamnaceae:0.0792438769):0.0421503389)o_Rosales:0.0444836491,(((Datisca_glomerata:0.1852487058,Begonia_fuchsioides:0.359537674):0.0429809948,(((Telfairia_occidentalis:0.0692663854,((Cucurbita_moschata:0.0877272796,((Lagenaria_siceraria:0.0257376426,Citrullus_lanatus:0.0341127785):0.0048114755,(Cucumis_sativus:0.078315023,Benincasa_hispida:0.0394286685):0.0052549417):0.0318049983):0.0118428144,(Luffa_acutangula:0.0491920034,Herpetospermum_pedunculosum:0.0703855108):0.0051801343):0.0190180813):0.0137138426,Momordica_charantia:0.0785595321):0.0799987597,Gynostemma_pentaphyllum:0.1400558599)f_Cucurbitaceae:0.1709988795):0.0154878356,Coriaria_nepalensis:0.2844538614)o_Cucurbitales:0.0884766589):0.0124174168):0.0275820552,(((((((((((((((((Crucihimalaya_himalaica:0.0330445307,Boechera_stricta:0.028439214):0.0055995382,(Camelina_neglecta:0.0434525753,Capsella_rubella:0.0439086859):0.0140214731):0.0056263284,Turritis_glabra:0.0355188594):0.0065139302,\
(Physaria_fendleri:0.118900933,Arabidopsis_suecica:0.0532569152):0.0050083378):0.0068313857,Erysimum_cheiranthoides:0.0480971337):0.0122613594,Lepidium_aucheri:0.1025108048):0.0086965583,((Barbarea_vulgaris:0.039845664,Leavenworthia_alabamica:0.0776911639):0.0070707953,(Nasturtium_officinale:0.0532189856,Cardamine_occulta:0.0379889416):0.0083147539):0.0306293748):0.0216088649,Biscutella_laevigata_subsp._laevigata:0.1104377098):0.0053047301,(((((((((Crambe_hispanica:0.0474597628,((Sinapis_alba:0.0420110261,(Brassica_juncea_var._tumida:0.0389971111,(Raphanus_sativus:0.0349885572,(Erucastrum_elatum:0.0152563922,Hirschfeldia_incana:0.0127608921):0.030663907):0.0122368169):0.0088193619):0.0054850777,((Diplotaxis_tenuifolia:0.0545250176,Eruca_vesicaria_subsp._sativa:0.0479101922):0.0143825707,Moricandia_moricandioides:0.0416988817):0.0055492535):0.0070144082):0.0403949129,Orychophragmus_violaceus:0.0542850417):0.0066841985,(Sisymbrium_altissimum:0.055337841,(Isatis_tinctoria:0.0312309765,Conringia_planisiliqua:0.0285762381):0.0163397723):0.0054695843):0.0101941899,Schrenkiella_parvula:0.0529343422):0.0174377679,((Alliaria_petiolata:0.0298574809,Thlaspi_arvense:0.0517165064):0.0212648049,Eutrema_salsugineum:0.0645479632):0.0081067258):0.0080469566,((Noccaea_caerulescens:0.0227921732,Raparia_bulbosa:0.0226811976):0.0126532108,Microthlaspi_erraticum:0.0465348223):0.0622360812):0.0055916908,Kernera_saxatilis:0.0475085999):0.0083273921,\
((Pseudoturritis_turrita:0.0378569629,Arabis_alpina:0.0964402795):0.0176676654,(Aurinia_saxatilis:0.0811924296,Odontarrhena_argentea:0.0670711641):0.0572401189):0.0113693559):0.0060959525,((Iberis_pinnata:0.1076816757,Anastatica_hierochuntica:0.0812696044):0.0150724702,Pugionium_dolabratum:0.0829459727):0.0096414458):0.0061126838):0.0154590333,Euclidium_syriacum:0.1198689467):0.0521992742,Aethionema_arabicum:0.1481797842)f_Brassicaceae:0.1397556702,Tarenaya_hassleriana:0.1742587859):0.2978901858,(Bretschneidera_sinensis:0.1247991583,(Moringa_oleifera:0.1795087271,Carica_papaya:0.2404545497):0.0187719629):0.0139901939)o_Brassicales:0.0521154081,((((Theobroma_cacao:0.0283324948,Herrania_umbratica:0.0316087115):0.0565462747,((((Gossypium_sturtianum:0.0232903425,(Gossypioides_kirkii:0.015073665,Kokia_drynarioides:0.0177959474):0.0163872012):0.0580702599,Hibiscus_trionum:0.0920129971):0.0365473453,Adansonia_digitata:0.0820979698):0.024780355,Durio_zibethinus:0.0808449942):0.0185896862):0.0124975398,Corchorus_capsularis:0.1255110364)f_Malvaceae:0.1038018418,((Stellera_chamaejasme:0.1630320377,Aquilaria_sinensis:0.1167463768)f_Thymelaeaceae:0.2320124138,Shorea_leprosula:0.2132660817):0.0244751688)o_Malvales:0.0637131851):0.0203217839,(((Xanthoceras_sorbifolium:0.0711987821,Acer_yangbiense:0.0924871837):0.0128176163,((Litchi_chinensis:0.0349512112,Dimocarpus_longan:0.0356827238):0.0131717472,Nephelium_lappaceum:0.0383745918):0.0675835825)f_Sapindaceae:0.0883059887,\
((((Mangifera_indica:0.072245495,Anacardium_occidentale:0.0755488845):0.0357228384,(Pistacia_vera:0.0421680357,Toxicodendron_radicans:0.0511481048):0.0179103096)f_Anacardiaceae:0.0862024512,(Boswellia_sacra:0.0760922045,Bursera_cuneata:0.0727144929)f_Burseraceae:0.0640178089):0.0331483102,((((Murraya_koenigii:0.0558696575,(Atalantia_buxifolia:0.0255625898,Citrus_cavaleriei:0.0237639706):0.0298702517):0.0559276637,Zanthoxylum_bungeanum:0.0869689709)f_Rutaceae:0.0504719599,Ailanthus_altissimus:0.1243985868):0.0085920797,(Xylocarpus_granatum:0.1234846447,Azadirachta_indica:0.1030788302)f_Meliaceae:0.0304233031):0.0426309583):0.0168481847)o_Sapindales:0.0877903102):0.0081820756,Cephalotus_follicularis:0.276432327):0.0146518584,((((((((Jatropha_curcas:0.0823154344,Croton_setiger:0.163169373):0.0428444235,(Aleurites_moluccanus:0.0537767808,((Reutealis_trisperma:0.051102391,Vernicia_montana:0.0262002904):0.0034129439,Garcia_nutans:0.0857310748):0.0057519561):0.0552805969):0.0161582865,Omphalea_diandra:0.163623753):0.0112275963,((Cnidoscolus_aconitifolius:0.0851449516,Manihot_esculenta:0.0783583436):0.0192785714,Hevea_brasiliensis:0.0664733465):0.0537453928):0.0128650085,(((Excoecaria_cochinchinensis:0.1233840154,(Balakata_baccata:0.059072642,Triadica_sebifera:0.0518807358):0.04451177):0.0160990355,Euphorbia_peplus:0.2377999767):0.0532893857,(((Mercurialis_annua:0.1774729743,Dalechampia_spathulata:0.1695045744):0.0195747741,Ricinus_communis:0.1124267135):0.0045344306,\
((Mallotus_nudiflorus:0.0681605326,Macaranga_tanarius:0.0582779774):0.0557734654,Bocquillonia_castaneifolia:0.1597099404):0.008066319):0.0610090424):0.0122221169)f_Euphorbiaceae:0.0625416076,((((Rhizophora_apiculata:0.0668519191,(Kandelia_obovata:0.0453682708,Ceriops_tagal:0.055946795):0.0136349388):0.005624344,Bruguiera_gymnorhiza:0.0540699215):0.0388709184,Carallia_brachiata:0.0872856757)f_Rhizophoraceae:0.1301757738,Erythroxylum_longipes:0.2682130725):0.0591826825):0.0085975641,(((Salix_udensis:0.0614890646,Populus_simonii:0.0403536976)f_Salicaceae:0.1586031592,((Turnera_subulata:0.1581202233,Passiflora_organensis:0.1896003412)f_Passifloraceae:0.1150328848,Viola_pubescens_var._scabriuscula:0.2735250075):0.0238412127):0.021127072,((Linum_usitatissimum:0.4170409017,Hypericum_perforatum:0.4400696976):0.0412764568,(Breynia_disticha_f._nivosa:0.1687222754,Flueggea_neowawraea:0.1018855971)f_Phyllanthaceae:0.1840263466):0.0228142743):0.0110158497)o_Malpighiales:0.0645375801,Tripterygium_wilfordii:0.3018193175):0.0238013144):0.0279952992):0.0139302022,(((((Psidium_guajava:0.0435617907,Lenwebbia_sp._NSW1173648:0.0221939398):0.0062391871,(Rhodomyrtus_tomentosa:0.0492399526,Rhodamnia_argentea:0.034404883):0.0049686651):0.0234506214,(((((Corymbia_citriodora_subsp._variegata:0.0192542262,Angophora_floribunda:0.0172480911):0.0319243248,Eucalyptus_shirleyi:0.0576536277):0.0166619658,Syzygium_oleosum:0.0525167383):0.0051034791,Melaleuca_quinquenervia:0.0732116299):0.0053286934,Metrosideros_polymorpha_var._glaberrima:0.0508848493):0.0050718017)\
f_Myrtaceae:0.180048732,Melastoma_malabathricum_subsp._normale:0.4730803859):0.0554271969,((Chamaenerion_angustifolium:0.3473285524,(Punica_granatum:0.1176838749,(Trapa_incisa:0.1554913737,Sonneratia_alba:0.0850394458):0.0884157717)f_Lythraceae:0.1137195007):0.0723250173,(Combretum_micranthum:0.1017570455,Lumnitzera_littorea:0.0959793778)f_Combretaceae:0.2356122759):0.01922645)o_Myrtales:0.1422696993):0.0460851967,(Hamamelis_virginiana:0.1487171177,(Kalanchoe_fedtschenkoi:0.1485670837,Sedum_album:0.1692283614)f_Crassulaceae:0.4225483258)o_Saxifragales:0.0390436672):0.0125435358,((Vitis_vinifera:0.0503162981,Tetrastigma_voinierianum:0.1460131438)o_Vitales:0.1704805663,(Taxillus_chinensis:0.3718973424,Malania_oleifera:0.1924242513)o_Santalales:0.0915147105):0.0147347614):0.0113918224,(((((((((((((((Erythranthe_guttata:0.2179186154,(Striga_asiatica:0.223073028,(Phtheirospermum_japonicum:0.1081768242,Euphrasia_arctica:0.1988894853):0.0249063932)f_Orobanchaceae:0.0626748437):0.0137809307,(((((Ballota_nigra:0.0590381372,Prunella_vulgaris:0.0648991954):0.0731696649,Pogostemon_cablin:0.142589205):0.0443857068,Scutellaria_baicalensis:0.14613157):0.0129793754,Caryopteris_x_clandonensis:0.1222632563):0.0259026088,(((((Mentha_longifolia:0.056009427,Thymus_quinquecostatus:0.0788893941):0.0616495599,Leonotis_leonurus:0.1218983684):0.0113119127,Nepeta_tenuifolia:0.0996575272):0.0168471928,Salvia_splendens:0.142064808):0.0396597196,\
(((Plectranthus_barbatus:0.0847334002,Ocimum_tenuiflorum:0.1075455081):0.0366046562,Lavandula_angustifolia:0.1320108425):0.0249812861,Perilla_frutescens_var._frutescens:0.0948215568):0.0105984057):0.0870303521)f_Lamiaceae:0.0472329135):0.0078217343,Paulownia_fortunei:0.0640534131):0.0109558306,(Jacaranda_mimosifolia:0.097404827,Handroanthus_guayacan:0.1584248416)f_Bignoniaceae:0.0214201817):0.0069667791,Sesamum_indicum:0.1371929961):0.0067091209,((Andrographis_paniculata:0.2709955209,Avicennia_marina_subsp._marina:0.1357832341)f_Acanthaceae:0.0402165757,(Utricularia_gibba:0.4159808086,Pinguicula_primuliflora:0.257188769)f_Lentibulariaceae:0.1359606131):0.0104793803):0.0257815358,((Verbascum_thapsus:0.1093510269,Buddleja_alternifolia:0.0694649667)f_Scrophulariaceae:0.0708417262,((Linderniella_brevidens:0.1017686985,Craterostigma_plantagineum:0.0962545554):0.0134068121,Lindernia_subracemosa:0.0560067461)f_Linderniaceae:0.3470057785):0.0154421135):0.0251757325,(((Misopates_orontium:0.0969512203,Linaria_vulgaris:0.1220826075):0.0896961599,Plantago_ovata:0.285673987):0.023644823,Penstemon_barbatus:0.1681937531)f_Plantaginaceae:0.0468214858):0.0245906667,(Dorcoceras_hygrometricum:0.1168111879,Primulina_tabacum:0.0697401375)f_Gesneriaceae:0.2109357042):0.0766966997,((Fraxinus_pennsylvanica:0.0538148078,(Osmanthus_fragrans:0.045048985,Olea_europaea_subsp._europaea:0.0437574087):0.0157107931):0.0397827239,Forsythia_viridissima:0.0653362056)f_Oleaceae:0.12161998)o_Lamiales:0.1060949148,\
(((((((Lycium_barbarum:0.0623981486,Anisodus_acutangulus:0.0501793811):0.0179874307,((Solanum_rostratum:0.075392027,(Capsicum_baccatum:0.0763589396,Jaltomata_sinuosa:0.0372488778):0.0083195315):0.005487174,Datura_stramonium:0.0524069784):0.010578452):0.0343887892,Nicotiana_attenuata:0.0740432944):0.0231688797,Petunia_secreta:0.0956790431)f_Solanaceae:0.1641607509,(Cuscuta_epithymum:0.2576392362,Ipomoea_nil:0.1094670077)f_Convolvulaceae:0.1652829588)o_Solanales:0.0832659639,((Lithospermum_erythrorhizon:0.0856437517,Echium_plantagineum:0.0975325384)f_Boraginaceae:0.266714189,(Nemophila_menziesii:0.3221235657,Cordia_subcordata:0.1455612243):0.0414832425)o_Boraginales:0.1190467406):0.0153017084,(((Cinchona_pubescens:0.1276978603,((Coffea_eugenioides:0.0543334994,Gardenia_jasminoides:0.0579387522):0.0878967965,Mitragyna_speciosa:0.1089283101):0.0144437969):0.0328289035,(Ophiorrhiza_pumila:0.1085854586,(Gynochthodes_officinalis:0.0995283527,(Oldenlandia_corymbosa_var._corymbosa:0.1903131826,((Galium_porrigens_var._tenue:0.0722182008,Sherardia_arvensis:0.1066869185):0.1866369473,Leptodermis_oblonga:0.108015901):0.0272858792):0.0321017183):0.0432348018):0.0699905009)f_Rubiaceae:0.076592952,(((Catharanthus_roseus:0.1157294614,Vinca_minor:0.1371451626):0.0275365153,((((Asclepias_syriaca:0.0369608818,Calotropis_procera:0.0361737544):0.121437564,Apocynum_venetum:0.0910679086):0.0472830415,Rhazya_stricta:0.1089318729):0.0060533008,Voacanga_thouarsii:0.1042824115):0.0064776698)f_Apocynaceae:0.094462889,Gentiana_dahurica_var._dahurica:0.4000703532):0.0338118749)\
o_Gentianales:0.0988014851):0.0151536561):0.0764912365,(Ilex_paraguariensis:0.2024471938,Eucommia_ulmoides:0.3092461485):0.0203427792):0.0204413144,(((((((((((Helianthus_annuus:0.0261932185,Scalesia_atractyloides:0.0344586898):0.0357065431,Ambrosia_artemisiifolia:0.0769500239):0.0288309399,Bidens_hawaiensis:0.1130017857):0.0233701004,(((Flaveria_robusta:0.0743884412,Tagetes_patula:0.0913723755):0.0158364568,(Mikania_micrantha:0.0730202132,Stevia_rebaudiana:0.0992861387):0.0267138147):0.0045889766,Smallanthus_sonchifolius:0.0602175243):0.0067789326):0.0549953575,Pulicaria_dysenterica:0.1142184493):0.0146877137,((((Tanacetum_coccineum:0.0333483391,Glebionis_coronaria:0.0538877126):0.0121235186,(Chrysanthemum_seticuspe:0.0239947026,Artemisia_argyi:0.02479053):0.0138936742):0.1246135148,Senecio_squalidus:0.1363590205):0.0233855779,((Helichrysum_umbraculigerum:0.103660563,Erigeron_canadensis:0.140587319):0.0135268495,Calendula_officinalis:0.1696174629):0.0102015234):0.0161915262):0.0243182479,(Lactuca_sativa:0.0822650663,Cichorium_intybus:0.0718710697):0.0836043585):0.0095404662,Centrapalus_pauciflorus:0.1079667092):0.0127674155,((Cynara_cardunculus_var._scolymus:0.042569464,Arctium_lappa:0.0327605245):0.0076936426,(Centaurea_solstitialis:0.0373943584,Carthamus_tinctorius:0.0275648875):0.0423413729):0.0534660864)f_Asteraceae:0.2231786024,((Campanula_takesimana:0.0674190912,Adenophora_triphylla_var._japonica:0.072553233):0.090748417,(Platycodon_grandiflorus:0.038211852,Codonopsis_lanceolata:0.058146009):0.0406498031)f_Campanulaceae:0.1215489437)o_Asterales:0.0853964231,\
(((Hedera_helix:0.0529532202,Panax_ginseng:0.0567971373)f_Araliaceae:0.0538926307,((((Apium_graveolens:0.0433273703,Anethum_foeniculum:0.0441846386):0.0391666546,Daucus_carota:0.0866016789):0.0090904958,Oenanthe_sinensis:0.0582641437):0.2035463063,Centella_asiatica:0.1704539116)f_Apiaceae:0.0275943011)o_Apiales:0.1354404906,(Sambucus_nigra:0.1841698725,Lonicera_japonica:0.1958297097)o_Dipsacales:0.0431833462):0.0151062722):0.0381118607):0.0298212942,(((((Diospyros_kaki:0.2126272411,(Argania_spinosa:0.0661481502,Vitellaria_paradoxa:0.0482211421)f_Sapotaceae:0.1117283607):0.0127327661,((Actinidia_deliciosa:0.1392247022,((Vaccinium_macrocarpon:0.0833251409,Rhododendron_molle:0.0857187688):0.040225592,Arctostaphylos_glauca:0.1132240241)f_Ericaceae:0.0854004285):0.0286855864,Camellia_lanceoleosa:0.1408083967):0.0095718937):0.010365768,(Linanthus_parryae:0.3335529118,Primula_veris:0.4279499892):0.0455903749):0.034695874,Impatiens_glandulifera:0.5067127392)o_Ericales:0.0392336398,(Hydrangea_macrophylla:0.2269314044,Nyssa_sinensis:0.1394236693)o_Cornales:0.0223422452):0.0130707209):0.0539283572,(((((((((Spinacia_oleracea:0.1165949798,Chenopodium_quinoa:0.1086838314):0.0176457927,Dysphania_ambrosioides:0.1419029217):0.0357122184,(Suaeda_aralocaspica:0.1774158987,Bassia_scoparia:0.2068179353):0.0500128259):0.0118307677,(Patellifolia_procumbens:0.1084351211,Beta_corolliflora:0.0911905472):0.0535627943)f_Chenopodiaceae:0.0203192277,Amaranthus_tricolor:0.1982074124):0.0830558408,\
(((Silene_conica:0.0693960413,Heliosperma_pusillum:0.0618215457):0.1003064352,Dianthus_caryophyllus:0.1801494647):0.1175934542,Corrigiola_litoralis:0.178978134)f_Caryophyllaceae:0.0568631789):0.0347542865,((((Carnegiea_gigantea:0.0318759008,Selenicereus_undatus:0.0310508633)f_Cactaceae:0.0706419027,Portulaca_oleracea:0.1547485079):0.0181336538,Talinum_fruticosum:0.0947134884):0.0984778392,(Pharnaceum_exiguum:0.3446321845,Kewa_caespitosa:0.2090145751):0.0227850123):0.0250445206):0.1209718486,Simmondsia_chinensis:0.2736298376):0.0519482327,((Nepenthes_mirabilis:0.2295322591,Drosera_capensis:0.4471004597):0.0594318224,((Fagopyrum_tataricum:0.1588908524,((Oxyria_digyna:0.1355436558,Rheum_nobile:0.0603010961):0.0319415754,Polygonum_aviculare:0.1418394921):0.0484514615)f_Polygonaceae:0.169169997,Limonium_bicolor:0.386180134):0.118459911):0.0239465626)o_Caryophyllales:0.1812351992):0.0170009158):0.1059777886,Buxus_sempervirens:0.2673743113):0.0161732646,Tetracentron_sinense:0.1825091023):0.0235450039,((Telopea_speciosissima:0.074174625,Macadamia_integrifolia:0.0791154593)f_Proteaceae:0.1760823074,Nelumbo_nucifera:0.2154215764)o_Proteales:0.0409193173):0.013843145,(((Akebia_trifoliata:0.174740995,Kingdonia_uniflora:0.329040635):0.0187511598,(Berberis_thunbergii:0.3070967948,((Aquilegia_eximia:0.055837189,Thalictrum_thalictroides:0.0696562001):0.1416099163,Coptis_chinensis:0.1975643193)f_Ranunculaceae:0.105527084):0.0475927474):0.0164223602,((Papaver_somniferum:0.2642256527,Eschscholzia_californica_subsp._californica:0.2192469573):0.0282242472,Macleaya_cordata:0.0876949108)f_Papaveraceae:0.1331190248)\
o_Ranunculales:0.045643229):0.0987811132,Chloranthus_sessilifolius:0.282210001):0.024905511,((((((Cinnamomum_micranthum_f._kanehirae:0.0221300589,Umbellularia_californica:0.0253838931):0.0033290003,Litsea_cubeba:0.0217552142):0.0052026256,Persea_americana:0.0270109964)f_Lauraceae:0.1588988354,Chimonanthus_praecox:0.2144191356)o_Laurales:0.0717413442,(Liriodendron_chinense:0.0464156898,Magnolia_changhungtana:0.0479263531)o_Magnoliales:0.1568030619):0.0356433943,Aristolochia_fimbriata:0.4868004519):0.024601547):0.0294782527,(((((((((((((Brachypodium_distachyon:0.0849582474,((((Lolium_perenne:0.0561114,Dactylis_glomerata:0.0474446212):0.0094375673,Avena_atlantica:0.0609142082):0.0085801776,(Puccinellia_tenuiflora:0.0570309045,Alopecurus_myosuroides:0.0476846086):0.0151689354):0.0328842793,(((((Triticum_aestivum:0.0160996315,Aegilops_longissima:0.0186609695):0.0040117182,Thinopyrum_elongatum:0.0173858017):0.0091759539,Secale_cereale:0.0247360607):0.0070864029,Hordeum_marinum:0.0339445985):0.0224528796,Bromus_sterilis:0.0560077413):0.0459503594):0.0263177099):0.0314820587,Stipa_capillata:0.0534628353):0.0575508802,(Raddia_distichophylla:0.1321455145,(Dendrocalamus_latiflorus:0.0542068111,Phyllostachys_edulis:0.0523330804):0.0072281857):0.0138506988):0.0119969502,((Oryza_rufipogon:0.0547526117,Leersia_perrieri:0.0674979716):0.0293772492,Zizania_palustris:0.0896472603):0.0657338647):0.0153925267,((((((Digitaria_exilis:0.070810242,(Urochloa_ruziziensis:0.0778106383,(Setaria_italica:0.0224833635,Cenchrus_purpureus:0.0420388245):0.0165215973):0.0075921314):0.003829547,Panicum_virgatum:0.0550064569):0.0043532769,\
((Dichanthelium_oligosanthes:0.0491219959,Alloteropsis_semialata:0.0623314082):0.0078797127,Echinochloa_crus-galli:0.0590294788):0.0022932076):0.0204031955,(Paspalum_notatum:0.0848898774,(((((Sorghum_bicolor:0.0287074438,(Saccharum_officinarum:0.0225616955,Miscanthus_lutarioriparius:0.0245230792):0.004518425):0.0019243504,(Hyparrhenia_diplandra:0.0435459741,(Bothriochloa_decipiens:0.0344477461,Themeda_triandra:0.0342233498):0.0065586951):0.0054244419):0.0038553516,(Coix_aquatica:0.0371500485,Microstegium_vimineum:0.0450427791):0.0032308117):0.0025733388,Zea_luxurians:0.062839795):0.0037746148,Chrysopogon_serrulatus:0.036112017):0.0470380045):0.0130874386):0.0381048476,Phragmites_australis_subsp._australis:0.081919955):0.0076076168,(Eragrostis_curvula:0.0670798605,((Oropetium_thomaeum:0.0824139343,Eleusine_coracana_subsp._coracana:0.0663406094):0.0081409151,Zoysia_pacifica:0.0920509922):0.0171964584):0.0509018188):0.057907841):0.0780600768,Pharus_latifolius:0.1272981816)f_Poaceae:0.2893718824,(((Carex_myosuroides:0.1134383808,Cyperus_esculentus:0.1547049262):0.0262616527,Rhynchospora_pubera:0.1230900658)f_Cyperaceae:0.1460320029,(Luzula_sylvatica:0.2127008442,Juncus_effusus:0.2016943756)f_Juncaceae:0.1753276654):0.2594646736):0.0802511335,((Puya_raimondii:0.0299636674,Ananas_comosus:0.0388758836):0.0159632056,Tillandsia_fasciculata:0.0549219928)f_Bromeliaceae:0.1883825014):0.025257578,Typha_latifolia:0.2256400662)o_Poales:0.1054491429,((((Musa_beccarii:0.0331577099,Ensete_glaucum:0.0439773089)f_Musaceae:0.119766994,(Costus_lasius:0.2028413865,(Wurfbainia_villosa:0.053433496,\
(Zingiber_officinale:0.0341793489,Boesenbergia_rotunda:0.0389568755):0.0207258425)f_Zingiberaceae:0.2025669427):0.0433026517)o_Zingiberales:0.1128650688,Pontederia_paniculata:0.3450617822):0.0754031434,(((Areca_catechu:0.0694758918,(Elaeis_guineensis:0.0413716807,Cocos_nucifera:0.0509085617):0.0141638349):0.0132115342,Phoenix_dactylifera:0.0671218685):0.0351391906,(Calamus_simplicifolius:0.03942083,Metroxylon_sagu:0.021501033):0.0710204844)o_Arecales:0.1024082361):0.020953372):0.0531892311,(((((Asparagus_officinalis:0.2229513315,(Agapanthus_africanus:0.1657618305,Allium_cepa:0.4032873721)f_Amaryllidaceae:0.0354884808):0.0346194727,Hemerocallis_citrina:0.2772990927):0.0679376829,Iris_pallida:0.2797323554):0.0760455011,(((((Cymbidium_sinense:0.1134067426,(Papilionanthe_hookeriana_x_Papilionanthe_teres:0.0439142437,Phalaenopsis_aphrodite:0.0428223099):0.1011443738):0.0179890368,Dendrobium_officinale:0.1032254735):0.0419765513,Gastrodia_elata_f._glauca:0.2867079549):0.0924462445,Vanilla_planifolia:0.3385355942):0.0312889294,Apostasia_shenzhenica:0.2699919007)f_Orchidaceae:0.2156550491)o_Asparagales:0.0299441266,Chionographis_japonica:0.2617284722):0.0124360627):0.0265430349,((Trichopus_zeylanicus_subsp._travancoricus:0.2540284021,Dioscorea_dumetorum:0.2697083699)o_Dioscoreales:0.1238793087,(Acanthochlamys_bracteata:0.2830932964,Xerophyta_viscosa:0.2561152407)o_Pandanales:0.2198630766):0.0362122362):0.0939129254,(((Amorphophallus_konjac:0.0993192124,Colocasia_esculenta:0.1323040546):0.0875934938,(Spirodela_intermedia:0.1296350534,(Wolffia_australiana:0.3218262754,Lemna_minuta:0.2745979095):0.1149696859):0.1928213013)\
f_Araceae:0.1775017449,(Amphibolis_antarctica:0.3392978967,Zostera_marina:0.4571503689):0.2052265542)o_Alismatales:0.0586079018):0.1114990439):0.1399124045,(Nymphaea_colorata:0.2261374412,Brasenia_schreberi:0.2494388967)o_Nymphaeales:0.3164062794):0.057133905,Amborella_trichopoda:0.4187517128)c_Magnoliopsida:0.4047426111,((((Cryptomeria_japonica:0.0501530295,((Chamaecyparis_obtusa:0.0327176773,Cupressus_sempervirens:0.07279381):0.0048167398,Thuja_plicata:0.0490893786):0.0261315228):0.0181507904,(Sequoia_sempervirens:0.0255136318,Sequoiadendron_giganteum:0.0273087702):0.0274680341)f_Cupressaceae:0.0927673524,Taxus_wallichiana_var._yunnanensis:0.1302542229)o_Cupressales:0.1548598152,(Larix_kaempferi:0.0399780228,Pseudotsuga_menziesii:0.0451791883)o_Pinales:0.1962760578)c_Pinopsida:0.1903404278):0.3724701999,(Adiantum_capillus-veneris:0.2285927668,Ceratopteris_richardii:0.3224603121)c_Polypodiopsida:0.6586875717):0.1482446833,(Diphasiastrum_complanatum:0.6343052837,(Selaginella_moellendorffii:0.8463755125,Isoetes_taiwanensis:0.7364452829):0.1187242442)c_Lycopodiopsida:0.1117185939):0.081295499,((Marchantia_polymorpha:0.198599878,Lunularia_cruciata:0.1958691102):0.5330540267,(((((((Antitrichia_curtipendula:0.0289639949,Rhytidiadelphus_loreus:0.0206350231):0.0040923775,Climacium_dendroides:0.0203024704)o_Hypnales:0.0778223739,Pohlia_nutans:0.0753967182):0.0629413858,Ceratodon_purpureus:0.1197154472):0.0367189922,Physcomitrium_patens:0.1840493426)c_Bryopsida:0.1704201348,Polytrichum_commune:0.2335122141):0.2131831653,Sphagnum_fallax:0.3668157625):0.2619255608):0.0621670499):0.1233395476,Anthoceros_angustus:0.7057991661):1.444385353,Tetraselmis_striata:1.287642553):0.1800666295,\
(((Chlorella_sorokiniana:0.2666179736,(Micractinium_conductrix:0.3174263065,Auxenochlorella_pyrenoidosa:0.2711236521):0.0874921213):0.3603360573,Parachlorella_kessleri:0.6483700627)o_Chlorellales:0.3855838385,(((Coccomyxa_sp._Obi:0.8081169872,Botryococcus_braunii:1.148423359):0.1199586961,Chloroidium_sp._JM:1.30852615):0.1066430229,(Trebouxia_sp._TZW2008:0.8530941096,Asterochloris_erici:0.8854716382)o_Trebouxiales:0.2987279085):0.1566321049)c_Trebouxiophyceae:0.0944427458):0.0864183019,(((Dunaliella_primolecta:0.7796227984,(Haematococcus_sp._NG2:0.5731182608,(Characiochloris_sp._AAM3:0.0079628181,Chloromonas_sp._AAM2:0.0035345324):0.7310196174):0.1011442389):0.2871245396,((Chlamydomonas_reinhardtii:0.3273612408,(Gonium_pectorale:0.3036641418,(((Eudorina_sp._2006-703-Eu-15:0.2012466457,(Volvox_africanus:0.2493289882,Pleodorina_starrii:0.1494009964):0.0281328659):0.0789430846,Yamagishiella_unicocca:0.197616383):0.0543016217,Astrephomene_gubernaculifera:0.3378501552):0.036995843)f_Volvocaceae_-1:0.0638409293):0.080771896,Edaphochlamys_debaryana:0.3228784623):0.5462031839)o_Chlamydomonadales:0.173530643,(((Tetradesmus_obliquus:0.1251452212,Scenedesmus_sp._NREL_46B-D3:0.1393603497):0.2794060428,Desmodesmus_armatus:0.4735615304)f_Scenedesmaceae:0.3962656729,(Raphidocelis_subcapitata:0.3316052757,Monoraphidium_minutum:0.3280539124)f_Selenastraceae:0.4408025691)o_Sphaeropleales:0.2799545749)c_Chlorophyceae:0.2450402193):0,Bryopsis_sp._KO-2023:1.692850183);
`;
//var tree = phylotree.phylotree(test_string);
//.size([height, width]);

//window.setInterval (function () {});

var example_controls = d3.select("#controls_form").append("form");

//var svg = d3.select(container_id).append("svg")
//    .attr("width", width)
//    .attr("height", height);

function selection_handler_name_box(e) {
  var name_box = d3.select(this);
  switch (e.detail[0]) {
    case "save":
    case "cancel":
      name_box
        .property("disabled", true)
        .style("color", color_scheme(current_selection_id));

      break;
    case "new":
      name_box
        .property("disabled", false)
        .property("value", "new_selection_name")
        .style("color", color_scheme(selection_set.length));
      break;
    case "rename":
      name_box.property("disabled", false);
      break;
  }
}

function selection_handler_new(e) {
  var element = d3.select(this);
  $(this).data("tooltip", false);
  switch (e.detail[0]) {
    case "save":
    case "cancel":
      if (selection_set.length == max_selections) {
        element.classed("disabled", true);
        $(this).tooltip({
          title: "Up to " + max_selections + " are allowed",
          placement: "left",
        });
      } else {
        element.classed("disabled", null);
      }
      break;
    default:
      element.classed("disabled", true);
      break;
  }
}

function selection_handler_rename(e) {
  var element = d3.select(this);
  element.classed(
    "disabled",
    e.detail[0] == "save" || e.detail[0] == "cancel" ? null : true
  );
}

function selection_handler_save_selection_name(e) {
  var element = d3.select(this);
  element.style(
    "display",
    e.detail[0] == "save" || e.detail[0] == "cancel" ? "none" : null
  );
}

function selection_handler_name_dropdown(e) {
  var element = d3.select(this).selectAll(".selection_set");
  element.classed(
    "disabled",
    e.detail[0] == "save" || e.detail[0] == "cancel" ? null : true
  );
}

function selection_handler_delete(e) {
  var element = d3.select(this);
  $(this).tooltip("dispose");
  switch (e.detail[0]) {
    case "save":
    case "cancel":
      if (selection_set.length == 1) {
        element.classed("disabled", true);
        $(this).tooltip({
          title:
            "At least one named selection set <br> is required;<br>it can be empty, however",
          placement: "bottom",
          html: true,
        });
      } else {
        element.classed("disabled", null);
      }
      break;
    default:
      element.classed("disabled", true);
      break;
  }
}

var datamonkey_save_image = function (type, container) {
  var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg",
  };

  function get_styles(doc) {
    function process_stylesheet(ss) {
      try {
        if (ss.cssRules) {
          for (var i = 0; i < ss.cssRules.length; i++) {
            var rule = ss.cssRules[i];
            if (rule.type === 3) {
              // Import Rule
              process_stylesheet(rule.styleSheet);
            } else {
              // hack for illustrator crashing on descendent selectors
              if (rule.selectorText) {
                if (rule.selectorText.indexOf(">") === -1) {
                  styles += "\n" + rule.cssText;
                }
              }
            }
          }
        }
      } catch (e) {
        //console.log("Could not process stylesheet : " + ss); // eslint-disable-line
      }
    }

    var styles = "",
      styleSheets = doc.styleSheets;

    if (styleSheets) {
      for (var i = 0; i < styleSheets.length; i++) {
        process_stylesheet(styleSheets[i]);
      }
    }

    return styles;
  }

  var svg = $(container).find("svg")[0];
  if (!svg) {
    svg = $(container)[0];
  }

  var styles = get_styles(window.document);

  svg.setAttribute("version", "1.1");

  var defsEl = document.createElement("defs");
  svg.insertBefore(defsEl, svg.firstChild);

  var styleEl = document.createElement("style");
  defsEl.appendChild(styleEl);
  styleEl.setAttribute("type", "text/css");

  // removing attributes so they aren't doubled up
  svg.removeAttribute("xmlns");
  svg.removeAttribute("xlink");

  // These are needed for the svg
  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
  }

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
  }

  var source = new XMLSerializer()
    .serializeToString(svg)
    .replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var doctype =
    '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var to_download = [doctype + source];
  var image_string =
    "data:image/svg+xml;base66," + encodeURIComponent(to_download);

  if (navigator.msSaveBlob) {
    // IE10
    download(image_string, "image.svg", "image/svg+xml");
  } else if (type == "png") {
    b64toBlob(
      image_string,
      function (blob) {
        var url = window.URL.createObjectURL(blob);
        var pom = document.createElement("a");
        pom.setAttribute("download", "image.png");
        pom.setAttribute("href", url);
        $("body").append(pom);
        pom.click();
        pom.remove();
      },
      function (error) {
        console.log(error); // eslint-disable-line
      }
    );
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("download", "image.svg");
    pom.setAttribute("href", image_string);
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

$(document).ready(function () {
  tree = new phylotree.phylotree(monocot_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  // $('#tree_container').on('reroot', function (e) {
  //   update_selection_names();

  //   tree.display.countHandler(count => {
  //     $("#selected_branch_counter").text(function(d) {
  //       return count[current_selection_name];
  //     });
  //   });

  // });

  tree.display.selectionLabel(current_selection_name);

  // tree.display.countHandler(count => {
  //   $("#selected_branch_counter").text(function(d) {
  //     return count[current_selection_name];
  //   });
  // });

  // Get selection set names from parsed newick
  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  // $("#selection_new")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_new,
  //     false
  //   );
  // $("#selection_rename")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_rename,
  //     false
  //   );
  // $("#selection_delete")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_delete,
  //     false
  //   );
  // $("#selection_delete")
  //   .get(0)
  //   .dispatchEvent(
  //     new CustomEvent(selection_menu_element_action, {
  //       detail: ["cancel", null]
  //     })
  //   );
  // $("#selection_name_box")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_name_box,
  //     false
  //   );
  // $("#save_selection_name")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_save_selection_name,
  //     false
  //   );
  // $("#selection_name_dropdown")
  //   .get(0)
  //   .addEventListener(
  //     selection_menu_element_action,
  //     selection_handler_name_dropdown,
  //     false
  //   );

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});

$("#monocotBtn").click(function () {
  tree = new phylotree.phylotree(monocot_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  tree.display.selectionLabel(current_selection_name);

  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});

$("#arthropodsBtn").click(function () {
  tree = new phylotree.phylotree(arthopods_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  tree.display.selectionLabel(current_selection_name);

  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});

$("#fungiBtn").click(function () {
  tree = new phylotree.phylotree(fungi_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  tree.display.selectionLabel(current_selection_name);

  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});

$("#ascomycetesBtn").click(function () {
  tree = new phylotree.phylotree(fungi_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  tree.display.selectionLabel(current_selection_name);

  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});

$("#plantBtn").click(function () {
  tree = new phylotree.phylotree(plant_string);
  global_tree = tree;
  sort_nodes(false);
  tree.render({
    container: "#tree_container",
    "draw-size-bubbles": false,
    "bubble-styler": (d) => {
      return 5;
    },
    "node-styler": node_colorizer,
    "font-size": 12,
    zoom: false,
    "edge-styler": edge_colorizer,
  });

  tree.display.selectionLabel(current_selection_name);

  if (tree.parsed_tags.length) {
    selection_set = tree.parsed_tags;
  }

  // Until a cleaner solution to supporting both Observable and regular HTML
  $(tree.display.container).append(tree.display.show());

  update_selection_names();

  $("#save_image").on("click", function (e) {
    datamonkey_save_image("svg", "#tree_container");
  });
});
$("#phyloTree_Graph_Section").css("min-height", "329px");
// $("#table_section").css("min-height", "371px");
$("#main_container").css("min-height", "571px");
var _warn = console.warn;

console.warn = function () {
  if (arguments[0].includes("Phylotree User Warning")) {
    var warning_div = d3.select("#main_display").insert("div", ":first-child");
    warning_div
      .attr("class", "alert alert-danger alert-dismissable")
      .html(arguments[0]);
  }
  return _warn.apply(console, arguments);
};

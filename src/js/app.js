App = {
  webProvider: null,
  contracts: {},
  account: '0x0',

  initWeb: function() {
    console.log('started');
    if (window.ethereum) {
      App.webProvider = window.ethereum;
      document.getElementById("reg-form").style.display = "block";
    } else {
      $("#loader-msg").html('No metamask ethereum provider found');
      App.webProvider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }
    return App.initContract();
  },


  initContract: function() {
    $.getJSON("MissingPersons.json", function( missingPersons) {
      App.contracts.MissingPersons = TruffleContract(missingPersons);
      App.contracts.MissingPersons.setProvider(App.webProvider);
      App.listenForEvents();
      return App.render();
    });
  },

  registerUser: async function() {
    const name = document.getElementById("name").value;
    const role = document.getElementById("role").value;
    const addr = document.getElementById("addr").value;
    const contractInstance = await App.contracts.MissingPersons.deployed();

    try{
      await contractInstance.registerUser({ from: App.account }, name, role, addr);
      alert("Success!");
    } catch (error){
      console.log(error);
      alert("Failed");
    }

  }

  // render: async function() {
  //   const loader = $("#loader");
  //   const content = $("#content");

  //   loader.show();
  //   content.hide();

  //   if (window.ethereum) {
  //     try {
  //       const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  //       App.account = accounts;
  //       $("#accountAddress").html(`You have ${ App.account.length } account connected from metamask: ${ App.account } <br/> Current account in use: ${App.account[0]}`);
  //     } catch (error) {
  //       if (error.code === 4001) {
  //         console.warn('user rejected')
  //       }
  //       $("#accountAddress").html("Your Account: Not Connected");
  //       console.error(error);
  //     }
  //   }

  //   const contractInstance = await App.contracts.MissingPersons.deployed();

  //   const caseCount = await contractInstance.currCaseId;

  //   const caseResults = await $("#caseResults");
  //   caseResults.empty()

  //   const personResults = await $("#personsResults");
  //   personsResults.empty();

  // }


};

$(function() {
  $(window).load(function() {
    App.initWeb();
  });
});

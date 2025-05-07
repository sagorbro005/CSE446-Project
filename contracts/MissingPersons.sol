// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract MissingPersons {

    enum Role { Admin, Reporter, Investigator }

    struct User {
        address account;
        string name;
        Role role;
        string userAddress;
    }

    mapping(address => User) public users;

    function registerUser(address account, string memory name, uint role, string memory addr) public {
        require(role >= 0 && role <= 2, "Invalid role");

        users[account] = User({
            account: account,
            name: name,
            role: Role(role),
            userAddress: addr
        });

        if (role == 0) {
            regAdmin(account);
        } else if (role == 2) {
            regInvestigator(account);
        } 
    }

    function getUserRole(address account) public view returns (uint256) {
        if (users[account].account != address(0)){
            User memory user = users[account];
            return uint256(user.role);
        }
        return 5;      
    }


    function getUserName(address account) public view returns (string memory) {
        if (users[account].account != address(0)){
            User memory user = users[account];
            return user.name;
        }
        return "Not Found";      
    }

    function getUserAddress(address account) public view returns (string memory) {
        if (users[account].account != address(0)){
            User memory user = users[account];
            return user.userAddress;
        }
        return "Not Found";      
    }



    enum Status { Missing, Found }
    enum Urgency { High, Medium, Low }

    struct MissingPerson {
        uint256 caseId;
        string name;
        uint256 age;
        uint256 height;
        Status status;
        string description;
        string lastSeenDivision;
        string contactNumber;
        Urgency urgency;
        address reportedBy;
    }
    address[] public adminAddresses;
    address[] public investigatorAddresses;
    address public fAdmin;
    function regAdmin(address adminAccount) public {
        // require(users[adminAccount].role == Role.Admin, "Register can be done only by Admins");
        if (fAdmin == address(0)){
            fAdmin = adminAccount;
        }
        // for (uint256 i = 0; i < adminAddresses.length; i++) {
        // if (adminAddresses[i] == adminAccount) {
        //     revert("Admin already registered");
        // }
        // }

        adminAddresses.push(adminAccount);
    }
    function getFirstAdmin() public view returns (address) {
        return fAdmin;
    } 

    function getAllAdmins() public view returns (address[] memory) {
       return adminAddresses;
    }

    function regInvestigator(address investigatorAccount) public {
        investigatorAddresses.push(investigatorAccount);
    }
    function getAllInvestigators() public view returns (address[] memory) {
        return investigatorAddresses;
    }



    mapping(uint256 => MissingPerson) public cases;
    uint256 public currCaseId = 1;

    function addMissingPerson(address reporterAccount, string memory name, uint256 age, uint256 height, string memory description, string memory division, string memory contactNumber) public {
        require(users[reporterAccount].role == Role.Reporter, "Only reporters can add new report");

        Urgency urgencyLevel;
        if (age < 18) {
            urgencyLevel = Urgency.High;
        } else if (age > 50) {
            urgencyLevel = Urgency.Medium;
        } else {
            urgencyLevel = Urgency.Low;
        }

        cases[currCaseId] = MissingPerson(currCaseId, name, age, height,Status.Missing,description,division,contactNumber,urgencyLevel,reporterAccount);

        currCaseId++;
        missingpersonCount++;
    }
    
    function caseExists(uint256 caseId) public view returns (bool) {
    return caseId > 0 && caseId < currCaseId;
    }


    function getCaseCount() public view returns (uint256) {
        return currCaseId - 1;
    }

    function getCaseById(uint256 caseId) public view returns (
        uint256, string memory, uint256, uint256, Status, string memory, string memory, string memory, Urgency, address
    ) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        MissingPerson memory person = cases[caseId];
        return (
            person.caseId,
            person.name,
            person.age,
            person.height,
            person.status,
            person.description,
            person.lastSeenDivision,
            person.contactNumber,
            person.urgency,
            person.reportedBy
        );
    }

    function getAllCaseIds() public view returns (uint256[] memory) {
        uint256[] memory caseIds = new uint256[](currCaseId - 1);
        for (uint256 i = 1; i < currCaseId; i++) {
            caseIds[i - 1] = cases[i].caseId;
        }
        return caseIds;
    }


    function getMissingNameById(uint256 caseId) public view returns (string memory) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        return cases[caseId].name;
    }
    function getMissingStatusById(uint256 caseId) public view returns (Status) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        return cases[caseId].status;
    }
    function getMissingDivisionById(uint256 caseId) public view returns (string memory) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        return cases[caseId].lastSeenDivision;
    }
    function getMissingUrgencyById(uint256 caseId) public view returns (Urgency) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        return cases[caseId].urgency;
    }


    mapping(uint256 => address) public assignedInvestigator;
    function updateMissingStatus(address adminAccount, uint256 caseId, uint256 nstatus ) public {
        if (users[adminAccount].role != Role.Admin) {
            revert("Update can be done only by admin");
        }
        require(caseExists(caseId), "CaseId is invalid, doesn't exists");
        if (cases[caseId].status!= Status.Missing) {
            revert("Status cannot be changed.Found the person");
        }
        if(nstatus!=1) {
            revert("Invalid status");
        }
        cases[caseId].status=Status.Found;
    }
            
   function assignInvestigator(address adminAccount, uint256 caseId, address investigatorAccount ) public {
    if (users[adminAccount].role != Role.Admin) {
            revert("Update can be done only by admin");
    }
    if (users[investigatorAccount].role != Role.Investigator) {
        revert("Invalid NID");
    }
    if (assignedInvestigator[caseId]!=address(0)){
       revert("Can't assign twice in the same case");
    }
    assignedInvestigator[caseId] = investigatorAccount;
   }
   uint256 public missingpersonCount=0;

   function search(string memory division) public view returns (uint256){
    bytes memory inptdivision= bytes(division);
    uint256 count=1;

    for(uint256 i=1; i< missingpersonCount; i++){
        bytes memory currentDivision= bytes(cases[i].lastSeenDivision);
        if (EqualityCheck(inptdivision, currentDivision) && cases[i].status == Status.Missing){
            count++;
        }

    }
    return count;
   }
   function sorting(bool ascend) public view returns (uint256[] memory, uint256[] memory) {
    string[8] memory bdDivs=["Dhaka", "Barishal","Chittagong","Khulna","Rangpur","Mymensingh","Sylhet","Rajshahi"];
    uint256[8] memory bdDiv = [uint256(0), uint256(1), uint256(2), uint256(3), uint256(4), uint256(5), uint256(6), uint256(7)];
    uint256[8] memory counts;
    
    for (uint256 k = 0; k < 8; k++) {
        counts[k] = 0;
    }
    
    for(uint256 j = 1; j < currCaseId; j++) {
        if (cases[j].status == Status.Missing) {
            for (uint256 k = 0; k < 8; k++) {
                if (EqualityCheck(bytes(cases[j].lastSeenDivision), bytes(bdDivs[bdDiv[k]]))) {
                    counts[k]++;
                    break;
                }
            }
        }
    }
    

    for (uint m = 0; m < 7; m++) {
        for (uint256 k = 0; k < 7 - m; k++) {
            bool cond = ascend ? counts[k] > counts[k + 1] : counts[k] < counts[k + 1];
            if (cond) {

                uint256 tcount = counts[k];
                counts[k] = counts[k + 1];
                counts[k + 1] = tcount;

                uint256 tdiv = bdDiv[k];
                bdDiv[k] = bdDiv[k + 1];
                bdDiv[k + 1] = tdiv;
            }
        }
    }
    
    uint256[] memory sortDiv = new uint256[](8);
    uint256[] memory sortcounts = new uint256[](8);
     
    for(uint256 i = 0; i < 8; i++) {
        sortDiv[i] = bdDiv[i];
        sortcounts[i] = counts[i];
    }

    return (sortDiv, sortcounts);
}

   function EqualityCheck(bytes memory inpt, bytes memory current) public pure returns (bool) {
    if (inpt.length == current.length) {
        
    
    for (uint256 j=0;j<inpt.length; j++) {
        if (inpt[j] != current[j]){
          return false;
        }
    }
    return true;
    }
    else{
        return false;
    }
   }
    mapping(address => mapping(uint256 => bool)) public slots;
    struct InvestigationAppointment{
        address investigatorNid;
        uint256 caseId;
        address reporterNid;
        uint256 slot;
        
        
    }
    
    
    mapping(address => mapping(uint256 => bool)) public bookedSlots;


    uint256 public constant SLOT_DURATION = 10 minutes;


    function bookSlot(uint256 caseId, uint256 slot, address investigator, address reporter, address AdminAddr) public payable {
        require(users[reporter].role == Role.Reporter, "Only reporters can book slots");
        require(users[investigator].role == Role.Investigator, "Invalid investigator");
        require(!bookedSlots[investigator][slot], "Slot already booked");
        require(msg.value >= 0.0001 ether, "Insufficient payment");


        bookedSlots[investigator][slot] = true;


        listOfAppointments.push(InvestigationAppointment({
            investigatorNid: investigator,
            caseId: caseId,
            reporterNid: reporter,
            slot: slot
        }));

        
        payable(AdminAddr).transfer(msg.value);
    }

    
    function getAvailableSlots(address investigator) public view returns (bool[144] memory) {
        bool[144] memory availableSlots;
        for (uint256 i = 0; i < 144; i++) {
            availableSlots[i] = !bookedSlots[investigator][i];
        }
        return availableSlots;
    }

    InvestigationAppointment[] public listOfAppointments;
    function viewAppointment() public view returns (address[] memory, uint256[] memory, address[] memory, uint256[] memory) {
        uint256 length = listOfAppointments.length;
        address[] memory investigatorNids = new address[](length);
        uint256[] memory caseIds = new uint256[](length);
        address[] memory reporterNids = new address[](length);
        uint256[] memory slotss = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            InvestigationAppointment memory appointment = listOfAppointments[i];
            investigatorNids[i] = appointment.investigatorNid;
            caseIds[i] = appointment.caseId;
            reporterNids[i] = appointment.reporterNid;
            slotss[i] = appointment.slot;
        }

        return (investigatorNids, caseIds, reporterNids, slotss);
    }

    mapping(uint256 => bool) public investigatorReports;

    function reportByInvestigator(uint256 caseId) public {
        require(users[msg.sender].role == Role.Investigator, "Only investigators can report");
        require(caseExists(caseId), "CaseId is invalid, doesn't exist");
        require(cases[caseId].status == Status.Missing, "Case is already marked as found");

        investigatorReports[caseId] = true;
    }

    function isReportedFound(uint256 caseId) public view returns (bool) {
        return investigatorReports[caseId];
    }

    function reportFoundByInvestigator(uint256 caseId) public {
        require(users[msg.sender].role == Role.Investigator, "Only investigators can report");
        require(caseExists(caseId), "CaseId is invalid, doesn't exist");
        require(cases[caseId].status == Status.Missing, "Case is already marked as found");
        

        investigatorReports[caseId] = true;
        
        // // Update the case status to Found
        // cases[caseId].status = Status.Found;
    }

    function getInvestigatorByCaseId(uint256 caseId) public view returns (address) {
        require(caseExists(caseId), "CaseId is invalid, doesn't exist");
        return assignedInvestigator[caseId];
    }

    function reportSituationByInvestigator(uint256 caseId, string memory situation) public {
        require(users[msg.sender].role == Role.Investigator, "Only investigators can report");
        require(caseExists(caseId), "CaseId is invalid, doesn't exist");
        require(cases[caseId].status == Status.Missing, "Case is already marked as found");

        investigatorReports[caseId] = true;
    }

    function updateCaseStatusByAdmin(uint256 caseId, uint256 nstatus) public {
        require(users[msg.sender].role == Role.Admin, "Only admins can update case status");
        require(caseExists(caseId), "CaseId is invalid, doesn't exist");
        require(cases[caseId].status == Status.Missing, "Case is already marked as found");
        require(nstatus == uint256(Status.Found), "Invalid status");

        cases[caseId].status = Status.Found;
    }
}
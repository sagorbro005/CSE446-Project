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
    }

    enum Status { Missing, Found }
    enum Urgency { Low, High, Medium }

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
    

    mapping(uint256 => address) public assignedInvestigator;
    function updateMissingStatus(address adminAccount, uint256 caseId, uint256 nstatus ) public {
        if (users[adminAccount].role != Role.Admin) {
            revert("Update can be done only by admin");
        }
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
   function sorting(bool ascend) public view returns (string[] memory, uint256[] memory) {
    string[8] memory bdDiv=["Dhaka", "Barishal","Chittagong","Khulna","Rangpur","Mymensingh","Sylhet","Rajshahi"];
    uint256[8] memory counts;
    
    // Initialize counts
    for (uint256 k = 0; k < 8; k++) {
        counts[k] = 0;
    }
    
    // Count missing persons per division
    for(uint256 j = 1; j < currCaseId; j++) {
        if (cases[j].status == Status.Missing) {
            for (uint256 k = 0; k < 8; k++) {
                if (EqualityCheck(bytes(cases[j].lastSeenDivision), bytes(bdDiv[k]))) {
                    counts[k]++;
                    break;
                }
            }
        }
    }
    
    // Bubble sort - fixed implementation
    for (uint m = 0; m < 7; m++) {
        for (uint256 k = 0; k < 7 - m; k++) {
            bool cond = ascend ? counts[k] > counts[k + 1] : counts[k] < counts[k + 1];
            if (cond) {
                // Swap counts
                uint256 tcount = counts[k];
                counts[k] = counts[k + 1];
                counts[k + 1] = tcount;
                
                // Swap divisions
                string memory tdiv = bdDiv[k];
                bdDiv[k] = bdDiv[k + 1];
                bdDiv[k + 1] = tdiv;
            }
        }
    }
    
    // Prepare return values - using same variable names
    string[] memory sortDiv = new string[](8);
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
    

    

  

    InvestigationAppointment[] public listOfAppointments;
    address public AdminAddr;
    constructor(){
        AdminAddr=msg.sender;
    
    }
   function bookslot(uint256 caseId, uint256 slot, address investigatorNid,address reporterNid) public payable{
    if (users[reporterNid].role!=Role.Reporter){
        revert("Only reporters can request");

    }
    if (users[investigatorNid].role != Role.Investigator){
        revert("Not an investigator");
    }
    if(slots[investigatorNid][slot]== true){
        revert("Slot taken");
    }

    if (msg.value < 10000000000000000){
        revert("Need to pay little amount to admin");
    }
    slots[investigatorNid][slot]=true;
    listOfAppointments.push(InvestigationAppointment({
        investigatorNid: investigatorNid,
        caseId: caseId,
        reporterNid: reporterNid,
        slot: slot
    }
        ));
        payable(AdminAddr).transfer(msg.value);

    }
 function viewAppointment() public view returns (InvestigationAppointment[] memory) {
    return listOfAppointments;
 }
}
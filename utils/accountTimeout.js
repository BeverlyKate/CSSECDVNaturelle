const dayjs= require("dayjs");

const TIMEOUT_RULES = [
    {attempts: 3, timeout: 2 * 60 * 1000 }, //2 minutes 
    {attempts: 5, timeout: 5 * 60 * 1000}, //5 minutes 
    {attempts: 7, timeout: 15 * 60 * 1000}, //15 minutes 
    {attempts: 9, timeout: 60 * 60 * 1000}, //1 hour
];

async function handleFailedAttempt (userDoc){
    userDoc.numAttempts += 1;

    const rule= TIMEOUT_RULES.find(r => r.attempts === userDoc.numAttempts)

    if (rule){ //if a rule corresponding to attempts is found, update timeoutEnd 
        userDoc.timeoutEnd= new Date(Date.now()+rule.timeout);
    }

    if (userDoc.numAttempts>9){
        userDoc.timeoutEnd= new Date(Date.now()+876600 * 60 * 1000); //unlock 100 years later
    }

    await userDoc.save();
}

function timeOutMessage(userDoc){
    if(userDoc.timeoutEnd != null && userDoc.numAttempts%2 == 1){
        return "Too many incorrect attempts. Your account is temporarily locked. Please try again later.";
    }if(userDoc.numAttempts>9){
        return "Contact the IT department it@naturelle.com to reset your account."; 
    }else{
        return "Incorrect email address or password!";
    }
}

async function resetAttempts(userDoc){
    userDoc.numAttempts= 0;
    userDoc.timeoutEnd= null;
    await userDoc.save();
}

module.exports= {
    handleFailedAttempt, 
    timeOutMessage,
    resetAttempts
}
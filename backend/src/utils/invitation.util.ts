export const generateInvitationCode = (): string => {
  // Generate a 6-character alphanumeric code
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export const validateInvitationCode = (code: string): boolean => {
  const invitationPattern = /^[A-Z2-9]{6}$/;
  return invitationPattern.test(code);
};
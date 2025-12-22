// Utility functions for sharing content to X (Twitter)

const ROVERS_HASHTAGS = '#Rovers #NFT #Web3';

export const shareToX = (text: string, maxLength: number = 280) => {
  // Truncate text if needed, leaving room for hashtags
  const hashtagLength = ROVERS_HASHTAGS.length + 1; // +1 for space
  const availableLength = maxLength - hashtagLength;
  
  let shareText = text;
  if (text.length > availableLength) {
    shareText = text.substring(0, availableLength - 3) + '...';
  }
  
  const fullText = `${shareText} ${ROVERS_HASHTAGS}`;
  const encodedText = encodeURIComponent(fullText);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  
  window.open(twitterUrl, '_blank', 'width=550,height=420');
};

export const shareBattleResult = (
  winner: string,
  loser: string,
  winnerPower: number,
  loserPower: number
) => {
  const text = `⚔️ ROVER BATTLE RESULTS ⚔️\n\n🏆 ${winner} (${winnerPower} PWR) defeated ${loser} (${loserPower} PWR)!\n\nSimulate your own battles at Rover.Imagine`;
  shareToX(text);
};

export const shareMission = (roverName: string, mission: string) => {
  const text = `📡 MISSION LOG from ${roverName}:\n\n"${mission}"`;
  shareToX(text);
};

export const shareStory = (roverName: string, story: string) => {
  // For longer stories, we take the first ~200 chars
  const storyPreview = story.length > 180 
    ? story.substring(0, 180) + '...' 
    : story;
  const text = `📖 ROVER TRANSMISSION from ${roverName}:\n\n"${storyPreview}"`;
  shareToX(text);
};

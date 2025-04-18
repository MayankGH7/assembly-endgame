import { useEffect, useRef, useState } from "react";
import {clsx} from "clsx"
import ReactConfetti from "react-confetti";
import { FallingEmojis } from 'falling-emojis';
import { supabase } from "./util/supabaseClient";
import {getFarewellText, getRandomWord, languages} from "./util/util"


function App() {

  const [currentWord, setCurrentWord] = useState((): string => getRandomWord());
  const [lettersGuessed, setLettersGuessed] = useState<string[]>([]);
  const newGameBtn = useRef<HTMLButtonElement>(null);
  const hintPara = useRef<HTMLSpanElement>(null);

  const alphabets = "abcdefghijklmnopqrstuvwxyz";

  const wrongGuessCount = lettersGuessed.filter(letter => !currentWord.includes(letter)).length;

  const isGameWon = currentWord.split("").every(letter => lettersGuessed.includes(letter));

  const isGameLost = wrongGuessCount >= (languages.length - 1);
  
  const isGameOver = isGameLost || isGameWon ;
  
  const lastGuessedLetter = lettersGuessed?.[lettersGuessed.length - 1];
  const isLastGuessWrong = lastGuessedLetter && !currentWord.includes(lastGuessedLetter);
  const statusColor = isGameOver
  ? isGameWon ? "bg-green-500" : "bg-red-500"
  : isLastGuessWrong && lettersGuessed.length
  ? "bg-[#765fa2] border-2 border-dashed border-black flex justify-center items-center"
  : ""


  useEffect(() => {
    const btn = newGameBtn.current;
    if(btn) btn.scrollIntoView({behavior: "smooth"});
  }, [isGameOver]);

  useEffect(() => {
    hintPara.current!.textContent = "Loading...";
    async function fetchRecipe(){
      try {
        const {data, error} = await supabase.functions.invoke<{response: string}>("get_hint", {
          body: {
            message: currentWord
          }
        });
        if(error || !data){
          throw error;
        }
        hintPara.current!.textContent = data.response;
      }catch(err){
        console.error(err);
        hintPara.current!.style.color = "red";
        hintPara.current!.textContent = "Error fetching hint";
      }
    };
    fetchRecipe();
  }, [currentWord]);

  function setGuessedLetter(letter: string){
    setLettersGuessed(prev => prev.includes(letter) ? prev : [...prev, letter])
  }


  return (
    <main className="p-5 pt-0">
      {isGameOver ? isGameWon ? <ReactConfetti recycle={false} numberOfPieces={1000} /> : <FallingEmojis emoji={'😭'} /> : "" }
      <header className="mb-7">
        <h1 className="text-4xl my-5 font-medium">Assembly: Endgame</h1>
        <p className="text-gray-400 max-w-lg mx-auto">Guess the word in under 8 attempts to keep the
        programming world safe from Assembly!</p>
      </header>

      <section className={`status ${statusColor} rounded-lg py-2 px-4 max-w-xl min-h-[4.75rem] mx-auto`} aria-live="polite" role="status">
        {isGameOver ? (
          <>
            <h2 className="text-2xl font-medium mb-1">
              {isGameWon ? "You win!" : "Game Over!"}
            </h2>
            <p className="font-normal">
              {isGameWon ? "Well done 🥳" : "You lose! Better start learning assembly 😭"}
            </p>
          </>
        ) : (
          isLastGuessWrong && (
            <p className="italic text-xl">
              {wrongGuessCount ? getFarewellText(languages[wrongGuessCount - 1].name) : ""}
            </p>
          )
        )}
      </section>

      <section id="languages" className="flex justify-center flex-wrap gap-2 max-w-xl my-10 mx-auto">
        {languages.map(( language, idx ) => {
          return <span
            key={language.name} 
            style={{backgroundColor: language.backgroundColor, color: language.color}}
            className={ `p-2 rounded-md font-medium relative select-none ${(idx < wrongGuessCount)? "dead": "" }` }>{language.name}
          </span>
        })}
      </section>

      <section id="word" className="flex gap-1 items-start justify-center mb-10 mx-auto flex-wrap gap-y-3">
        {currentWord.split("").map(( letter, idx ) => {
          const notGuessedLetterClass = clsx(
            isGameLost && !lettersGuessed.includes(letter) && "bg-[red]"
          );
          const shouldRevealLetter = isGameLost || lettersGuessed.includes(letter);
          return <span 
            key={idx} 
            className={ `size-12 ${isGameLost || isGameWon ? "bg-[green]" :"bg-[#222]"} border-b-2 p-2 font-semibold text-2xl flex justify-center items-center select-none ${notGuessedLetterClass}` }>
              {shouldRevealLetter ? letter.toUpperCase() : ""}
          </span>
        })}
      </section>

      {/* Status Section for a11y purpose */}
      <section className="sr-only" aria-live="polite" role="status">
        <p>
          {currentWord.includes(lastGuessedLetter) ? 
              `Correct! The letter ${lastGuessedLetter} is in the word.` : 
              `Sorry, the letter ${lastGuessedLetter} is not in the word.`
          }
          You have {languages.length - 1} attempts left.
        </p>
        <p>{currentWord.split("").map(letter => lettersGuessed.includes(letter)? letter + " "  : "blank").join(" ")}</p>
      </section>

      <section className="my-7">
      <p><b>Hint: </b><span ref={hintPara}></span></p>
      </section>

      <section className="max-w-2xl flex flex-wrap justify-center gap-2">
        {alphabets.split("").map(alphabet => {
          const isGuessed = lettersGuessed.includes(alphabet);
          const isCorrect = isGuessed && currentWord.includes(alphabet);
          const isWrong = isGuessed && !currentWord.includes(alphabet);

          const bgColor = clsx({
            "bg-[#f2bd4b]": !isCorrect && !isWrong,
            "bg-[green]": isCorrect,
            "bg-[red]": isWrong
          });

          return <button 
            key={alphabet} 
            disabled={isGameOver}
            aria-disabled={lettersGuessed.includes(alphabet)}
            aria-label={`Letter ${alphabet}`}
            onClick={() => setGuessedLetter(alphabet)} 
            className={`p-2 size-11  sm:size-16 ${bgColor} text-black rounded-lg font-bold text-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-500`}>
              {alphabet.toUpperCase()}
          </button>
        })}
      </section>

      { isGameLost && 
        <p className="mt-7 font-semibold text-xl">The word was <span className="text-green-500">{currentWord.toUpperCase()}</span></p>
      }
        
      {
      isGameOver &&
      <button ref={newGameBtn} onClick={() => {
        setLettersGuessed([]);
        setCurrentWord(getRandomWord())
      }} className="bg-[dodgerblue] py-2 px-4 rounded-2xl my-10 border font-medium text-2xl cursor-pointer">New Game</button>
      }
    </main>
  )
}

export default App

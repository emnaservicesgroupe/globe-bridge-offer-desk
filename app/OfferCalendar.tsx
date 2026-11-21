"use client";
import {useState} from "react";
import {ChevronLeft,ChevronRight} from "lucide-react";

type Props = {dates:(string|null)[]; selected:string; choose:(date:string)=>void};
const monthFormat=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric",timeZone:"UTC"});

export default function OfferCalendar({dates,selected,choose}:Props){
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Tirane"}).format(new Date());
  const [month,setMonth]=useState(()=>(selected||today).slice(0,7));
  const start=new Date(month+"-01T12:00:00Z");
  const year=start.getUTCFullYear(), index=start.getUTCMonth();
  const days=new Date(Date.UTC(year,index+1,0)).getUTCDate();
  const offset=(start.getUTCDay()+6)%7;
  const counts=new Map<string,number>();
  for(const date of dates)if(date)counts.set(date,(counts.get(date)??0)+1);
  function move(delta:number){
    setMonth(new Date(Date.UTC(year,index+delta,1)).toISOString().slice(0,7));
    choose("");
  }
  return <section className="offer-calendar" aria-label="Offer calendar">
    <div className="row"><h3>{monthFormat.format(start)}</h3><div className="month-controls">
      <button aria-label="Previous month" onClick={()=>move(-1)}><ChevronLeft size={16}/></button>
      <button aria-label="Next month" onClick={()=>move(1)}><ChevronRight size={16}/></button>
    </div></div>
    <div className="month-grid">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(s=><small key={s}>{s}</small>)}
      {Array.from({length:offset},(_,i)=><span key={"blank"+i}/>)}
      {Array.from({length:days},(_,i)=>{
        const day=month+"-"+String(i+1).padStart(2,"0"), n=counts.get(day)??0;
        return <button key={day} aria-label={day+", "+n+" offers"} aria-pressed={selected===day}
          onClick={()=>choose(day)}>{i+1}{n>0&&<span>{n}</span>}</button>
      })}
    </div>
    {selected&&<div className="selection"><strong>Offers for {selected}</strong><button onClick={()=>choose("")}>Clear date</button></div>}
  </section>;
}

'use client';
import BuyerGate from '@/components/buyer-gate';
import Menu from '@/components/household-app';
import {useHousehold} from '@/commercial/context';
function HouseholdApp(){const {ready}=useHousehold();return ready?<Menu/>:<main role="status">Loading your Table…</main>}
export default function BuyerApp(){return <BuyerGate><HouseholdApp/></BuyerGate>}

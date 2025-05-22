"use client";

import { useEffect, useState } from "react";
import { CreditCard, LogOut, User, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth, useClerk, UserProfile } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getAllUserOrdersProfile,
  getUserById,
  saveAddress,
} from "@/lib/database/actions/user.actions";

import Link from "next/link";
import { useForm } from "@mantine/form";
import { toast } from "sonner";
import { getSavedCartForUser } from "@/lib/database/actions/cart.actions";

export default function MyProfileComponent() {
  const { userId } = useAuth();
  const [orders, setOrders] = useState<any[]>();
  const [address, setAddress] = useState<any>();
  const { signOut } = useClerk();

  useEffect(() => {
    async function fetchAllUserOrders() {
      try {
        if (!userId) return;
        await getAllUserOrdersProfile(userId)
          .then((res) => {
            setOrders(res);
          })
          .catch((err) => {
            console.log(err);
            toast.error(err);
          });
      } catch (error: any) {
        console.log(error);
      }
    }
    fetchAllUserOrders();
  }, [userId]);

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
    id: "",
  });

  useEffect(() => {
    if (userId) {
      getUserById(userId).then((res) => {
        if (res?.success) {
          setUser({
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            email: res.user.email,
            avatar: res.user.image,
            id: res.user._id,
          });
        } else {
          console.log(res?.message);
          toast.error(res?.message);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // user was removed as it caused an infinite loop

  useEffect(() => {
    if (userId) {
      getSavedCartForUser(userId)
        .then((res) => {
          if ('address' in res) {
            setAddress(res.address);
          } else {
            setAddress(null); // Handle cases where address is not present
          }
        })
        .catch((err) => {
          toast.error(err);
        });
    }
  }, [userId]);

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      state: "",
      city: "",
      zipCode: "",
      address1: "",
      address2: "",
      country: "",
    },
    validate: {
      firstName: (value) =>
        value.trim().length < 6
          ? "First name must be at least 6 letters"
          : null,
      lastName: (value) =>
        value.trim().length < 2 ? "Last name must be at least 2 letters" : null,
      state: (value) =>
        value.length < 2 ? "State must be at least 2 letters" : null,
      city: (value) =>
        value.length < 2 ? "City must be at least 2 letters" : null,
      zipCode: (value) =>
        value.length < 6 ? "Zip Code must be at least 6 characters." : null,
      address1: (value) =>
        value.length > 100
          ? "Address 1 must be at least 100 characters."
          : null,
      address2: (value) =>
        value.length > 100
          ? "Address 2 must be at least 100 characters."
          : null,
    },
  });

  useEffect(() => {
    if (address && Object.keys(address).length > 0) {
      form.setValues({
        firstName: address.firstName || "",
        lastName: address.lastName || "",
        state: address.state || "",
        city: address.city || "",
        zipCode: address.zipCode || "",
        address1: address.address1 || "",
        address2: address.address2 || "",
        country: address.country || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // form was removed as it caused an infinite loop

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="font-bold text-2xl text-center mb-[50px]">MY PROFILE</div>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-1/4 lg:sticky top-[1rem] self-start">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback>
                    {user.firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="capitalize">{`${user.firstName} ${user.lastName}`}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </CardFooter>
          </Card>
        </aside>
        <main className="flex-1">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 m-0 sm:p-auto sm:m-auto">
                  <UserProfile />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View your past orders and their status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders &&
                      orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex-row items-center justify-between  border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-gray-500">
                              {order.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ₹{order.total.toFixed(2)}
                            </p>
                            <Link
                              href={`/order/${order.id}`}
                              className="text-blue-500 underline text-sm flex items-center gap-[0px]"
                            >
                              See Details <ChevronRight size={15} />
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                  <CardDescription>
                    Update your billing address details here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={form.onSubmit(async (values) => {
                      await saveAddress({ ...values, active: true }, user.id)
                        .then((res) => {
                          setAddress(res.addresses);
                          toast.success("Successfully added address");
                          // router.refresh();
                        })
                        .catch((err) => {
                          console.log(err);
                          toast.error(err);
                        });
                    })}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName">First Name</label>
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          {...form.getInputProps("firstName")}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName">Last Name</label>
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          {...form.getInputProps("lastName")}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="state">State</label>
                      <Input
                        id="state"
                        placeholder="State"
                        {...form.getInputProps("state")}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="city">City</label>
                      <Input
                        id="city"
                        placeholder="City"
                        {...form.getInputProps("city")}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="zipCode">Zip Code / Postal Code</label>
                        <Input
                          id="zipCode"
                          placeholder="Zip Code / Postal Code"
                          {...form.getInputProps("zipCode")}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="address1">Address 1</label>
                      <Input
                        id="address1"
                        placeholder="Address 1"
                        {...form.getInputProps("address1")}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="address2">Address 2</label>
                      <Input
                        id="address2"
                        placeholder="Address 2"
                        {...form.getInputProps("address2")}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="country">Country</label>
                      <Input
                        id="country"
                        placeholder="Country"
                        {...form.getInputProps("country")}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Save Address
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

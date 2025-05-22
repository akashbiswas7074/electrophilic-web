import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const ProductDetailsAccordian = ({
  description,
  keyBenefits,
  ingredients,
  details,
}: {
  description: string;
  keyBenefits: any[];
  ingredients: any[];
  details: any[];
}) => {
  return (
    <div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="uppercase subHeading tracking-[1px]">
            Description
          </AccordionTrigger>
          <AccordionContent>
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </AccordionContent>
        </AccordionItem>
        {keyBenefits.length > 0 && (
          <AccordionItem value="item-2">
            <AccordionTrigger className="uppercase subHeading tracking-[1px]">
              KEY BENEFITS
            </AccordionTrigger>
            <AccordionContent>
              {keyBenefits.map((i, index) => (
                <div className="" key={index}>
                  {i.name}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {ingredients.length > 0 && (
          <AccordionItem value="item-3">
            <AccordionTrigger className="uppercase subHeading tracking-[1px]">
              Ingredients
            </AccordionTrigger>
            <AccordionContent>
              {ingredients.map((i, index) => (
                <div className="" key={index}>
                  {i.name}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {details.length > 0 && (
          <AccordionItem value="item-4">
            <AccordionTrigger className="uppercase subHeading tracking-[1px]">
              Details
            </AccordionTrigger>
            <AccordionContent>
              {details.map((i, index) => (
                <div className="" key={index}>
                  {i.name}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default ProductDetailsAccordian;
